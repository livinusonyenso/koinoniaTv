import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface YTVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      maxres?: { url: string };
      high?: { url: string };
      default?: { url: string };
    };
    liveBroadcastContent: 'live' | 'upcoming' | 'none';
  };
  contentDetails?: { duration: string };
  statistics?: { viewCount: string; likeCount: string };
  liveStreamingDetails?: {
    scheduledStartTime?: string;
    actualStartTime?: string;
  };
}

export class YouTubeQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YouTubeQuotaError';
  }
}

@Injectable()
export class YoutubeApiService {
  private readonly logger = new Logger(YoutubeApiService.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly channelId: string;

  constructor(private config: ConfigService) {
    this.apiKey = config.get<string>('YOUTUBE_API_KEY')!;
    this.channelId = config.get<string>('YOUTUBE_CHANNEL_ID')!;
    this.http = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3',
      timeout: 30_000,
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  parseDuration(iso: string): number {
    if (!iso) return 0;
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return +(m[1] || 0) * 3600 + +(m[2] || 0) * 60 + +(m[3] || 0);
  }

  bestThumbnail(thumbnails: YTVideoItem['snippet']['thumbnails']): string {
    return (
      thumbnails?.maxres?.url ||
      thumbnails?.high?.url ||
      thumbnails?.default?.url ||
      ''
    );
  }

  private handleError(context: string, err: unknown): never {
    const axiosErr = err as AxiosError;
    const status = axiosErr?.response?.status;
    if (status === 403) {
      this.logger.warn(
        `[${context}] YouTube API quota exceeded (403) — DB will serve stale data`,
      );
      throw new YouTubeQuotaError(`Quota exceeded during ${context}`);
    }
    if (status === 400) {
      this.logger.error(
        `[${context}] Bad request: ${JSON.stringify(axiosErr.response?.data)}`,
      );
    } else {
      this.logger.error(`[${context}] ${axiosErr.message}`);
    }
    throw err;
  }

  // ─── Core: fetch full video details by IDs ──────────────────────────────────
  // Cost: 1 quota unit per request (up to 50 IDs per call)

  async fetchVideoDetails(ids: string): Promise<YTVideoItem[]> {
    try {
      const res = await this.http.get('/videos', {
        params: {
          key: this.apiKey,
          id: ids,
          part: 'snippet,contentDetails,statistics,liveStreamingDetails',
        },
      });
      return res.data.items || [];
    } catch (err) {
      return this.handleError('fetchVideoDetails', err);
    }
  }

  // ─── Incremental: only fetch videos newer than a given date ─────────────────
  // Cost: 100 units (search) + 1 unit per 50 IDs (videos.list)
  // Uses publishedAfter to avoid re-fetching existing videos.

  async fetchVideosSince(since: Date, maxResults = 50): Promise<YTVideoItem[]> {
    try {
      const publishedAfter = since.toISOString();
      const search = await this.http.get('/search', {
        params: {
          key: this.apiKey,
          channelId: this.channelId,
          part: 'id',
          order: 'date',
          type: 'video',
          publishedAfter,
          maxResults,
        },
      });
      const ids = (search.data.items || [])
        .map((i: any) => i.id.videoId)
        .join(',');
      if (!ids) return [];
      return this.fetchVideoDetails(ids);
    } catch (err) {
      if (err instanceof YouTubeQuotaError) throw err;
      return this.handleError('fetchVideosSince', err);
    }
  }

  // ─── Stats-only refresh: update viewCount/likeCount for existing videos ─────
  // Cost: 1 unit per request (videos.list, no search needed)
  // Used to keep trending data accurate without fetching everything.

  async fetchVideoStats(youtubeIds: string[]): Promise<YTVideoItem[]> {
    if (!youtubeIds.length) return [];
    const results: YTVideoItem[] = [];
    try {
      for (let i = 0; i < youtubeIds.length; i += 50) {
        const batch = youtubeIds.slice(i, i + 50).join(',');
        const res = await this.http.get('/videos', {
          params: { key: this.apiKey, id: batch, part: 'statistics' },
        });
        results.push(...(res.data.items || []));
      }
    } catch (err) {
      if (err instanceof YouTubeQuotaError) throw err;
      return this.handleError('fetchVideoStats', err);
    }
    return results;
  }

  // ─── Live check (CHEAP): uses videos.list not search ────────────────────────
  // Cost: 1 unit per request.
  // Pass recently known video IDs from DB — check if any are now live.
  // Only falls back to the expensive search when nothing is found here.

  async checkLiveCheap(recentYoutubeIds: string[]): Promise<YTVideoItem[]> {
    if (!recentYoutubeIds.length) return [];
    try {
      const ids = recentYoutubeIds.slice(0, 50).join(',');
      const res = await this.http.get('/videos', {
        params: { key: this.apiKey, id: ids, part: 'snippet' },
      });
      return (res.data.items || []).filter(
        (v: YTVideoItem) => v.snippet.liveBroadcastContent === 'live',
      );
    } catch (err) {
      if (err instanceof YouTubeQuotaError) throw err;
      this.logger.error(`checkLiveCheap error: ${(err as Error).message}`);
      return [];
    }
  }

  // ─── Live check (FULL SEARCH): finds brand-new live streams not yet in DB ───
  // Cost: 100 units (search.list with eventType=live).
  // Call this less frequently — once per hour is sufficient.

  async checkLiveSearch(): Promise<YTVideoItem[]> {
    try {
      const res = await this.http.get('/search', {
        params: {
          key: this.apiKey,
          channelId: this.channelId,
          part: 'id',
          eventType: 'live',
          type: 'video',
          maxResults: 5,
        },
      });
      const ids = (res.data.items || [])
        .map((i: any) => i.id.videoId)
        .join(',');
      if (!ids) return [];
      return this.fetchVideoDetails(ids);
    } catch (err) {
      if (err instanceof YouTubeQuotaError) throw err;
      this.logger.error(`checkLiveSearch error: ${(err as Error).message}`);
      return [];
    }
  }

  // ─── Upcoming streams ────────────────────────────────────────────────────────
  // Cost: 100 units (search) + 1 unit per 50 IDs

  async fetchUpcomingStreams(): Promise<YTVideoItem[]> {
    try {
      const res = await this.http.get('/search', {
        params: {
          key: this.apiKey,
          channelId: this.channelId,
          part: 'id',
          eventType: 'upcoming',
          type: 'video',
          maxResults: 10,
        },
      });
      const ids = (res.data.items || [])
        .map((i: any) => i.id.videoId)
        .join(',');
      if (!ids) return [];
      return this.fetchVideoDetails(ids);
    } catch (err) {
      if (err instanceof YouTubeQuotaError) throw err;
      this.logger.error(
        `fetchUpcomingStreams error: ${(err as Error).message}`,
      );
      return [];
    }
  }

  // ─── Full channel sync (all videos, paginated) ───────────────────────────────
  // Cost: 1 unit (channels.list) + N × 1 unit (playlistItems pages) + M × 1 unit (videos.list batches)

  async fetchAllChannelVideos(): Promise<YTVideoItem[]> {
    const channelRes = await this.http.get('/channels', {
      params: { key: this.apiKey, id: this.channelId, part: 'contentDetails' },
    });
    const uploadsId =
      channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];

    const allIds: string[] = [];
    let pageToken: string | undefined;

    do {
      const res = await this.http.get('/playlistItems', {
        params: {
          key: this.apiKey,
          playlistId: uploadsId,
          part: 'contentDetails',
          maxResults: 50,
          pageToken,
        },
      });
      allIds.push(
        ...(res.data.items || []).map((i: any) => i.contentDetails.videoId),
      );
      pageToken = res.data.nextPageToken;
    } while (pageToken);

    const details: YTVideoItem[] = [];
    for (let i = 0; i < allIds.length; i += 50) {
      const batch = allIds.slice(i, i + 50).join(',');
      const batchDetails = await this.fetchVideoDetails(batch);
      details.push(...batchDetails);
    }
    return details;
  }

  // ─── Legacy alias kept for manual trigger ────────────────────────────────────
  async fetchLatestVideos(maxResults = 10): Promise<YTVideoItem[]> {
    return this.fetchVideosSince(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      maxResults,
    );
  }
}
