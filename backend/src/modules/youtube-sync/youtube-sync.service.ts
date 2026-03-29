import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Video, SyncStatus } from '../videos/video.entity';
import { VideoCategory } from '../categories/video-category.entity';
import { SyncLog, SyncType } from './sync-log.entity';
import {
  YoutubeApiService,
  YTVideoItem,
  YouTubeQuotaError,
} from './youtube-api.service';
import { CategorizationService } from './categorization.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class YoutubeSyncService {
  private readonly logger = new Logger(YoutubeSyncService.name);

  // Tracks whether a live stream was active on the previous check.
  // Used to send a push notification only once when a stream starts.
  private wasLive = false;

  // Tracks the last time a full live-search (100-unit call) was run,
  // so we don't do it every 30 minutes — only once per hour.
  private lastLiveSearchAt = new Date(0);

  constructor(
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(SyncLog) private logRepo: Repository<SyncLog>,
    @InjectRepository(VideoCategory) private vcRepo: Repository<VideoCategory>,
    private ytApi: YoutubeApiService,
    private categorization: CategorizationService,
    @Optional() private notif?: NotificationService,
    @Optional() @Inject(CACHE_MANAGER) private cache?: Cache,
  ) {}

  // ─── Cron 1: Incremental sync every 6 hours ──────────────────────────────────
  // Fetches only videos published AFTER the most recently stored video.
  // Quota cost: ~101 units per run (1 search + up to 1 videos.list per 50 new videos).
  // Total: ~404 units/day — well within the 10,000/day free quota.

  @Cron('0 0 */6 * * *')
  async incrementalSync() {
    this.logger.log('▶ Incremental sync started');
    try {
      const since = await this.getLastPublishedAt();
      this.logger.log(`  Fetching videos since: ${since.toISOString()}`);
      await this.runSync(SyncType.INCREMENTAL, () =>
        this.ytApi.fetchVideosSince(since, 50),
      );
    } catch (err) {
      if (err instanceof YouTubeQuotaError) {
        this.logger.warn(
          'Incremental sync skipped — quota exceeded, DB data still served',
        );
      } else {
        this.logger.error(`Incremental sync failed: ${(err as Error).message}`);
      }
    }
  }

  // ─── Cron 2: Stats refresh every 6 hours (offset by 1 hour) ─────────────────
  // Updates viewCount/likeCount for the top 100 most-viewed videos.
  // Keeps trending data fresh without re-fetching full metadata.
  // Quota cost: 2 units (2× videos.list for 100 IDs in batches of 50).

  @Cron('0 0 1-23/6 * * *')
  async statsRefresh() {
    this.logger.log('▶ Stats refresh started');
    try {
      const top = await this.videoRepo.find({
        select: ['id', 'youtubeId'],
        where: { isLive: false, isUpcoming: false },
        order: { viewCount: 'DESC' },
        take: 100,
      });
      if (!top.length) return;

      const ids = top.map((v) => v.youtubeId);
      const items = await this.ytApi.fetchVideoStats(ids);
      if (!items.length) return;

      let updated = 0;
      for (const item of items) {
        if (!item.statistics) continue;
        const video = top.find((v) => v.youtubeId === item.id);
        if (!video) continue;
        await this.videoRepo.update(video.id, {
          viewCount: +(item.statistics.viewCount || 0),
          likeCount: +(item.statistics.likeCount || 0),
        });
        updated++;
      }

      await this.invalidateCache();
      this.logger.log(`Stats refresh done: ${updated} videos updated`);
    } catch (err) {
      if (err instanceof YouTubeQuotaError) {
        this.logger.warn('Stats refresh skipped — quota exceeded');
      } else {
        this.logger.error(`Stats refresh failed: ${(err as Error).message}`);
      }
    }
  }

  // ─── Cron 3: Live status check every 30 minutes (QUOTA-EFFICIENT) ────────────
  // Strategy:
  //   a) Every 30 min: use videos.list (1 unit) on the 30 most recent DB videos to
  //      detect if an existing upload has gone live (e.g., a scheduled stream starting).
  //   b) Once per hour: also run a search?eventType=live (100 units) to catch
  //      brand-new live streams that aren't yet in the DB.
  //
  // Total cost: max ~48 units (cheap checks) + ~24×100 = 2,448 units/day.
  // This is reduced from the original 5-min interval: 288×100 = 28,800/day.

  @Cron('0 */30 * * * *')
  async liveCheck() {
    try {
      const liveVideos: YTVideoItem[] = [];

      // Step A: cheap check on recent DB videos (1 quota unit)
      const recent = await this.videoRepo.find({
        select: ['youtubeId'],
        order: { publishedAt: 'DESC' },
        take: 30,
      });
      if (recent.length) {
        const cheapLive = await this.ytApi.checkLiveCheap(
          recent.map((v) => v.youtubeId),
        );
        liveVideos.push(...cheapLive);
      }

      // Step B: full live search once per hour (100 quota units)
      const now = Date.now();
      if (now - this.lastLiveSearchAt.getTime() >= 60 * 60 * 1000) {
        const searchLive = await this.ytApi.checkLiveSearch();
        this.lastLiveSearchAt = new Date();
        // Merge without duplicates
        for (const v of searchLive) {
          if (!liveVideos.find((x) => x.id === v.id)) liveVideos.push(v);
        }
      }

      const isNowLive = liveVideos.length > 0;

      // Reset all currently-live flags
      await this.videoRepo.update({ isLive: true }, { isLive: false });

      // Set live flag for currently-live videos, upserting if not yet in DB
      for (const item of liveVideos) {
        try {
          const { video } = await this.upsertVideo(item, {
            isLive: true,
            isUpcoming: false,
          });
          this.logger.log(`Live stream active: ${video.title}`);
        } catch (err) {
          this.logger.error(
            `liveCheck upsert error for ${item.id}: ${(err as Error).message}`,
          );
        }
      }

      // Push notification: only fires once when stream transitions offline → live
      if (isNowLive && !this.wasLive && this.notif) {
        this.notif
          .sendToAll(
            '🔴 Koinonia is LIVE',
            'The Miracle Service has started. Join now!',
            { type: 'live_stream' },
          )
          .catch((err) =>
            this.logger.error(`Live notification failed: ${err.message}`),
          );
      }

      this.wasLive = isNowLive;
    } catch (err) {
      if (err instanceof YouTubeQuotaError) {
        this.logger.warn(
          'Live check skipped — quota exceeded, current DB live status preserved',
        );
      } else {
        this.logger.error(`Live check failed: ${(err as Error).message}`);
      }
    }
  }

  // ─── Cron 4: Upcoming streams check every 6 hours (at :30 offset) ────────────
  // Quota cost: ~101 units per run.

  @Cron('0 30 */6 * * *')
  async upcomingCheck() {
    this.logger.log('▶ Upcoming streams check started');
    try {
      const items = await this.ytApi.fetchUpcomingStreams();
      for (const item of items) {
        const scheduledStart = item.liveStreamingDetails?.scheduledStartTime
          ? new Date(item.liveStreamingDetails.scheduledStartTime)
          : undefined;
        try {
          await this.upsertVideo(item, { isUpcoming: true, scheduledStart });
        } catch (err) {
          this.logger.error(
            `upcomingCheck upsert error for ${item.id}: ${(err as Error).message}`,
          );
        }
      }
      this.logger.log(`Upcoming check done: ${items.length} stream(s) stored`);
    } catch (err) {
      if (err instanceof YouTubeQuotaError) {
        this.logger.warn('Upcoming check skipped — quota exceeded');
      } else {
        this.logger.error(`Upcoming check failed: ${(err as Error).message}`);
      }
    }
  }

  // ─── Cron 5: Full channel sync every Sunday at 2am ───────────────────────────
  // Fetches ALL channel videos to catch any gaps from failed incremental syncs.
  // Quota cost: high (1 per 50 playlist items + 1 per 50 video details pages).
  // Run weekly to avoid quota exhaustion.

  @Cron('0 0 2 * * 0')
  async fullSync() {
    this.logger.log('▶ Full sync started');
    try {
      await this.runSync(SyncType.FULL, () =>
        this.ytApi.fetchAllChannelVideos(),
      );
    } catch (err) {
      if (err instanceof YouTubeQuotaError) {
        this.logger.warn('Full sync skipped — quota exceeded');
      } else {
        this.logger.error(`Full sync failed: ${(err as Error).message}`);
      }
    }
  }

  // ─── Manual trigger (admin endpoint) ─────────────────────────────────────────

  async triggerManualSync(type: 'full' | 'incremental' = 'incremental') {
    if (type === 'full') {
      return this.runSync(SyncType.FULL, () =>
        this.ytApi.fetchAllChannelVideos(),
      );
    }
    const since = await this.getLastPublishedAt();
    return this.runSync(SyncType.INCREMENTAL, () =>
      this.ytApi.fetchVideosSince(since, 50),
    );
  }

  // ─── Core sync runner ─────────────────────────────────────────────────────────

  private async runSync(
    syncType: SyncType,
    fetcher: () => Promise<YTVideoItem[]>,
  ) {
    const log = this.logRepo.create({ syncType });
    const start = Date.now();
    let added = 0,
      updated = 0,
      errorMsg = '';

    try {
      const items = await fetcher();
      this.logger.log(`  Fetched ${items.length} video(s) from YouTube`);

      for (const item of items) {
        try {
          const { video, isNew } = await this.upsertVideo(item);
          if (isNew) {
            await this.categorization.autoTag(video);
            added++;
            if (this.notif) {
              this.notif
                .sendToAll('🎙️ New Sermon Available', video.title, {
                  type: 'new_video',
                  videoId: String(video.id),
                })
                .catch((err) =>
                  this.logger.error(
                    `New video notification failed: ${err.message}`,
                  ),
                );
            }
          } else {
            const catCount = await this.vcRepo.count({
              where: { videoId: video.id },
            });
            if (catCount === 0) await this.categorization.autoTag(video);
            updated++;
          }
        } catch (err) {
          this.logger.error(
            `Error processing video ${item.id}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      errorMsg = (err as Error).message;
      this.logger.error(`Sync failed: ${errorMsg}`);
    }

    log.videosAdded = added;
    log.videosUpdated = updated;
    log.errors = errorMsg || null;
    log.durationMs = Date.now() - start;
    log.completedAt = new Date();
    await this.logRepo.save(log);

    if (added > 0 || updated > 0) await this.invalidateCache();

    this.logger.log(
      `Sync done: +${added} added, ~${updated} updated in ${log.durationMs}ms`,
    );
    return log;
  }

  // ─── Safe upsert — handles duplicate key race conditions ─────────────────────

  private async upsertVideo(
    item: YTVideoItem,
    overrides: Partial<Video> = {},
  ): Promise<{ video: Video; isNew: boolean }> {
    const existing = await this.videoRepo.findOne({
      where: { youtubeId: item.id },
    });

    const data: Partial<Video> = {
      youtubeId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: this.ytApi.bestThumbnail(item.snippet.thumbnails),
      publishedAt: new Date(item.snippet.publishedAt),
      durationSeconds: item.contentDetails
        ? this.ytApi.parseDuration(item.contentDetails.duration)
        : 0,
      viewCount: +(item.statistics?.viewCount || 0),
      likeCount: +(item.statistics?.likeCount || 0),
      isLive: item.snippet.liveBroadcastContent === 'live',
      isUpcoming: item.snippet.liveBroadcastContent === 'upcoming',
      scheduledStart: item.liveStreamingDetails?.scheduledStartTime
        ? new Date(item.liveStreamingDetails.scheduledStartTime)
        : undefined,
      syncStatus: SyncStatus.SYNCED,
      ...overrides,
    };

    if (existing) {
      await this.videoRepo.update(existing.id, data);
      return { video: { ...existing, ...data } as Video, isNew: false };
    }

    try {
      const saved = await this.videoRepo.save(this.videoRepo.create(data));
      return { video: saved, isNew: true };
    } catch (err: any) {
      // Race condition: another process inserted the same youtubeId concurrently
      if (
        err.code === 'ER_DUP_ENTRY' ||
        err.message?.includes('Duplicate entry')
      ) {
        const found = await this.videoRepo.findOne({
          where: { youtubeId: item.id },
        });
        if (found) {
          await this.videoRepo.update(found.id, data);
          return { video: { ...found, ...data } as Video, isNew: false };
        }
      }
      throw err;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Returns the publishedAt of the most recently synced video in the DB.
   * Adds a 10-second buffer to avoid missing videos published at the exact boundary.
   * Falls back to 7 days ago if no videos exist yet (first run).
   */
  private async getLastPublishedAt(): Promise<Date> {
    const latest = await this.videoRepo.findOne({
      select: ['publishedAt'],
      where: { isLive: false, isUpcoming: false },
      order: { publishedAt: 'DESC' },
    });
    if (latest?.publishedAt) {
      // Subtract 10 seconds so we don't miss videos at the boundary
      return new Date(latest.publishedAt.getTime() - 10_000);
    }
    // First run: fetch the last 7 days
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  private async invalidateCache(): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del('videos:latest');
      await this.cache.del('videos:trending');
    } catch {
      /* cache failure must never block sync */
    }
  }
}
