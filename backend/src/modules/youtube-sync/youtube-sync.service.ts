import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Video, SyncStatus } from '../videos/video.entity';
import { SyncLog, SyncType } from './sync-log.entity';
import { YoutubeApiService, YTVideoItem } from './youtube-api.service';
import { CategorizationService } from './categorization.service';

@Injectable()
export class YoutubeSyncService {
  private readonly logger = new Logger(YoutubeSyncService.name);

  constructor(
    @InjectRepository(Video)   private videoRepo: Repository<Video>,
    @InjectRepository(SyncLog) private logRepo: Repository<SyncLog>,
    private ytApi: YoutubeApiService,
    private categorization: CategorizationService,
  ) {}

  /** ── Incremental sync every 30 minutes ─── */
  @Cron('0 */30 * * * *')
  async incrementalSync() {
    this.logger.log('▶ Incremental sync started');
    await this.runSync(SyncType.INCREMENTAL, () => this.ytApi.fetchLatestVideos(10));
  }

  /** ── Full sync every Sunday at 2am ─── */
  @Cron('0 0 2 * * 0')
  async fullSync() {
    this.logger.log('▶ Full sync started');
    await this.runSync(SyncType.FULL, () => this.ytApi.fetchAllChannelVideos());
  }

  /** ── Live status check every 5 minutes ─── */
  @Cron('0 */5 * * * *')
  async liveCheck() {
    const liveVideos = await this.ytApi.checkLiveStatus();
    // Reset all currently-live videos first
    await this.videoRepo.update({ isLive: true }, { isLive: false });

    for (const item of liveVideos) {
      await this.videoRepo.update(
        { youtubeId: item.id },
        { isLive: true, isUpcoming: false },
      );
    }
    if (liveVideos.length > 0) {
      this.logger.log(`Live check: ${liveVideos.length} active stream(s)`);
    }
  }

  /** ── Upcoming streams check every hour ─── */
  @Cron(CronExpression.EVERY_HOUR)
  async upcomingCheck() {
    const items = await this.ytApi.fetchUpcomingStreams();
    for (const item of items) {
      const scheduledStart = item.liveStreamingDetails?.scheduledStartTime
        ? new Date(item.liveStreamingDetails.scheduledStartTime)
        : null;

      await this.videoRepo.upsert(
        {
          youtubeId: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: this.ytApi.bestThumbnail(item.snippet.thumbnails),
          publishedAt: new Date(item.snippet.publishedAt),
          isUpcoming: true,
          scheduledStart: scheduledStart ?? undefined,
          syncStatus: SyncStatus.SYNCED,
        },
        ['youtubeId'],
      );
    }
  }

  /** ── Manual trigger (admin endpoint) ─── */
  async triggerManualSync(type: 'full' | 'incremental' = 'incremental') {
    if (type === 'full') {
      return this.runSync(SyncType.FULL, () => this.ytApi.fetchAllChannelVideos());
    }
    return this.runSync(SyncType.INCREMENTAL, () => this.ytApi.fetchLatestVideos(20));
  }

  /** ── Core sync runner ─── */
  private async runSync(
    syncType: SyncType,
    fetcher: () => Promise<YTVideoItem[]>,
  ) {
    const log = this.logRepo.create({ syncType });
    const start = Date.now();
    let added = 0, updated = 0, errorMsg = '';

    try {
      const items = await fetcher();

      for (const item of items) {
        try {
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
          };

          if (existing) {
            await this.videoRepo.update(existing.id, data);
            updated++;
          } else {
            const saved = await this.videoRepo.save(this.videoRepo.create(data));
            await this.categorization.autoTag(saved);
            added++;
          }
        } catch (err) {
          this.logger.error(`Error processing video ${item.id}: ${err.message}`);
        }
      }
    } catch (err) {
      errorMsg = err.message;
      this.logger.error(`Sync failed: ${err.message}`);
    }

    log.videosAdded   = added;
    log.videosUpdated = updated;
    log.errors = errorMsg.length ? errorMsg : null;
    log.durationMs    = Date.now() - start;
    log.completedAt   = new Date();
    await this.logRepo.save(log);

    this.logger.log(`Sync done: +${added} added, ~${updated} updated in ${log.durationMs}ms`);
    return log;
  }
}
