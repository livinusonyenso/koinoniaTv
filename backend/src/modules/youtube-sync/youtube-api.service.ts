import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface YTVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: { maxres?: { url: string }; high?: { url: string }; default?: { url: string } };
    liveBroadcastContent: 'live' | 'upcoming' | 'none';
    scheduledStartTime?: string;
  };
  contentDetails?: { duration: string };
  statistics?: { viewCount: string; likeCount: string };
  liveStreamingDetails?: { scheduledStartTime?: string; actualStartTime?: string };
}

@Injectable()
export class YoutubeApiService {
  private readonly logger = new Logger(YoutubeApiService.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly channelId: string;

  constructor(private config: ConfigService) {
    this.apiKey    = config.get<string>('YOUTUBE_API_KEY')!;
    this.channelId = config.get<string>('YOUTUBE_CHANNEL_ID')!;
    this.http = axios.create({ baseURL: 'https://www.googleapis.com/youtube/v3' });
  }

  /** Parse ISO 8601 duration (PT1H23M45S) to seconds */
  parseDuration(iso: string): number {
    if (!iso) return 0;
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + +(m[3] || 0);
  }

  bestThumbnail(thumbnails: YTVideoItem['snippet']['thumbnails']): string {
    return (
      thumbnails?.maxres?.url ||
      thumbnails?.high?.url   ||
      thumbnails?.default?.url ||
      ''
    );
  }

  /** Fetch latest videos via search (incremental sync) */
  async fetchLatestVideos(maxResults = 10): Promise<YTVideoItem[]> {
    try {
      const search = await this.http.get('/search', {
        params: {
          key: this.apiKey,
          channelId: this.channelId,
          part: 'id',
          order: 'date',
          type: 'video',
          maxResults,
        },
      });
      const ids = search.data.items.map((i: any) => i.id.videoId).join(',');
      if (!ids) return [];
      return this.fetchVideoDetails(ids);
    } catch (err) {
      this.logger.error('fetchLatestVideos error', err.message);
      return [];
    }
  }

  /** Fetch full video details by comma-separated IDs */
  async fetchVideoDetails(ids: string): Promise<YTVideoItem[]> {
    const res = await this.http.get('/videos', {
      params: {
        key: this.apiKey,
        id: ids,
        part: 'snippet,contentDetails,statistics,liveStreamingDetails',
      },
    });
    return res.data.items || [];
  }

  /** Fetch ALL channel videos page by page (full sync) */
  async fetchAllChannelVideos(): Promise<YTVideoItem[]> {
    // Step 1: get uploads playlist ID
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
      const ids = (res.data.items || []).map((i: any) => i.contentDetails.videoId);
      allIds.push(...ids);
      pageToken = res.data.nextPageToken;
    } while (pageToken);

    // Fetch details in batches of 50
    const details: YTVideoItem[] = [];
    for (let i = 0; i < allIds.length; i += 50) {
      const batch = allIds.slice(i, i + 50).join(',');
      const batchDetails = await this.fetchVideoDetails(batch);
      details.push(...batchDetails);
    }
    return details;
  }

  /** Check if channel is currently live */
  async checkLiveStatus(): Promise<YTVideoItem[]> {
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
      const ids = (res.data.items || []).map((i: any) => i.id.videoId).join(',');
      if (!ids) return [];
      return this.fetchVideoDetails(ids);
    } catch (err) {
      this.logger.error('checkLiveStatus error', err.message);
      return [];
    }
  }

  /** Fetch upcoming scheduled streams */
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
      const ids = (res.data.items || []).map((i: any) => i.id.videoId).join(',');
      if (!ids) return [];
      return this.fetchVideoDetails(ids);
    } catch (err) {
      this.logger.error('fetchUpcomingStreams error', err.message);
      return [];
    }
  }
}
