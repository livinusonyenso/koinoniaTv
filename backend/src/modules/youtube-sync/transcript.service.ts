import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface TranscriptLine {
  text: string;
  /** Start time in seconds */
  offset: number;
  /** Duration in seconds */
  duration: number;
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  async getTranscript(videoId: string): Promise<TranscriptLine[]> {
    try {
      const tracks = await this.fetchCaptionTracks(videoId);
      if (!tracks.length) return [];

      // Prefer English, fall back to first available
      const track =
        tracks.find((t: any) => t.languageCode === 'en') ||
        tracks.find((t: any) => t.languageCode?.startsWith('en')) ||
        tracks[0];

      if (!track?.baseUrl) return [];

      const lines = await this.parseTrackXml(track.baseUrl);
      this.logger.debug(`Fetched ${lines.length} transcript lines for ${videoId}`);
      return lines;
    } catch (err) {
      this.logger.warn(`Transcript unavailable for ${videoId}: ${err.message}`);
      return [];
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async fetchCaptionTracks(videoId: string): Promise<any[]> {
    // Strategy 1: innertube API (fast, no page scraping)
    try {
      const res = await axios.post(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        {
          context: {
            client: { clientName: 'ANDROID', clientVersion: '20.10.38' },
          },
          videoId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `com.google.android.youtube/20.10.38 (Linux; U; Android 14)`,
          },
          timeout: 10000,
        },
      );
      const tracks =
        res.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length) return tracks;
    } catch {
      // fall through to page scraping
    }

    // Strategy 2: scrape ytInitialPlayerResponse from watch page
    const pageRes = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      timeout: 12000,
    });
    const html = pageRes.data as string;
    const tracks = this.extractTracksFromHtml(html, videoId);
    return tracks;
  }

  private extractTracksFromHtml(html: string, videoId: string): any[] {
    const marker = 'ytInitialPlayerResponse = ';
    const start = html.indexOf(marker);
    if (start === -1) return [];
    let depth = 0, i = start + marker.length;
    for (; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}' && --depth === 0) break;
    }
    try {
      const json = JSON.parse(html.slice(start + marker.length, i + 1));
      return (
        json?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
      );
    } catch {
      return [];
    }
  }

  private async parseTrackXml(baseUrl: string): Promise<TranscriptLine[]> {
    const res = await axios.get(baseUrl, {
      headers: { 'User-Agent': UA },
      timeout: 10000,
    });
    const xml = res.data as string;

    // Two XML formats YouTube uses: <text start=…> and <p t=…>
    const lines: TranscriptLine[] = [];

    // Format 1: srv3 / timedtext XML  →  <text start="3.12" dur="2.5">…</text>
    const re1 = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let m: RegExpExecArray | null;
    while ((m = re1.exec(xml)) !== null) {
      const text = this.decodeEntities(m[3].replace(/<[^>]+>/g, '').trim());
      if (text) {
        lines.push({
          text,
          offset: parseFloat(m[1]),
          duration: parseFloat(m[2]),
        });
      }
    }

    if (lines.length) return lines;

    // Format 2: new <p t="3120" d="2500"> format (ms)
    const re2 = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    while ((m = re2.exec(xml)) !== null) {
      const text = this.decodeEntities(m[3].replace(/<[^>]+>/g, '').trim());
      if (text) {
        lines.push({
          text,
          offset: parseInt(m[1]) / 1000,   // ms → seconds
          duration: parseInt(m[2]) / 1000,
        });
      }
    }

    return lines;
  }

  private decodeEntities(s: string): string {
    return s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  }
}
