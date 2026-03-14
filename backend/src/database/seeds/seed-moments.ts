/**
 * Standalone moments seeder — no NestJS server needed.
 * Run: npx ts-node src/database/seeds/seed-moments.ts
 *
 * What it does:
 *  1. Clears the moments table
 *  2. Fetches all non-live, non-upcoming videos from DB
 *  3. Fetches YouTube transcript for each video
 *  4. Detects declarations (1/video), prayers (1/video), testimonies (up to 3/video)
 *  5. Inserts detected moments into DB
 */

import { DataSource } from 'typeorm';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// ── DB connection ─────────────────────────────────────────────────────────────

const ds = new DataSource({
  type: 'mysql',
  driver: require('mysql2'),
  host:     process.env.DB_HOST     || 'localhost',
  port:     +(process.env.DB_PORT   || 3306),
  database: process.env.DB_NAME     || 'koinonia_tv',
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  entities: [],
  synchronize: false,
});

// ── Keyword dictionaries (mirrors moments-detection.service.ts) ───────────────

const DECLARATION_KEYWORDS_P1 = ['this week', 'this week you will', 'this week you shall'];
const DECLARATION_KEYWORDS_P2 = ['i declare', 'i decree', 'i speak over your life', 'i prophesy'];
const DECLARATION_KEYWORDS_P3 = [
  'receive it', 'be blessed', 'it is done', 'in the name of jesus',
  'may the lord', 'let it be established', 'receive grace',
  'receive your miracle', 'it is established',
];
const ALL_DECLARATION_KEYWORDS = [...DECLARATION_KEYWORDS_P1, ...DECLARATION_KEYWORDS_P2, ...DECLARATION_KEYWORDS_P3];

const PRAYER_KEYWORDS_P1 = ['lift your voice and pray', 'open your mouth and pray', 'pray with me', 'let us pray'];
const PRAYER_KEYWORDS_P2 = ['pray in the spirit', 'begin to pray', 'pray this prayer', 'say after me'];
const PRAYER_KEYWORDS_P3 = ['father lord', 'heavenly father', 'dear lord', 'we come before you'];
const ALL_PRAYER_KEYWORDS = [...PRAYER_KEYWORDS_P1, ...PRAYER_KEYWORDS_P2, ...PRAYER_KEYWORDS_P3];

const TESTIMONY_KEYWORDS = [
  'someone shared a testimony', 'a testimony came', 'this person testified',
  'i received a testimony', 'listen to this testimony', 'a lady shared',
  'a man shared', 'they wrote to us', 'testimony of', 'testified that',
  'a brother', 'a sister', 'she was healed', 'he was healed',
  'the doctor said', 'they told me', 'miracle happened',
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface TranscriptLine { text: string; offset: number; duration: number; }
interface MomentRow {
  type: string; title: string; youtubeId: string; videoId: number;
  startTime: number; endTime: number; thumbnailUrl: string | null;
  sermonTitle: string; transcriptText: string;
}

// ── Transcript fetching (mirrors transcript.service.ts) ───────────────────────

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

async function parseTrackXml(baseUrl: string): Promise<TranscriptLine[]> {
  const res = await axios.get(baseUrl, { headers: { 'User-Agent': UA }, timeout: 10000 });
  const xml = res.data as string;
  const lines: TranscriptLine[] = [];

  const re1 = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = re1.exec(xml)) !== null) {
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, '').trim());
    if (text) lines.push({ text, offset: parseFloat(m[1]), duration: parseFloat(m[2]) });
  }
  if (lines.length) return lines;

  const re2 = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  while ((m = re2.exec(xml)) !== null) {
    const text = decodeEntities(m[3].replace(/<[^>]+>/g, '').trim());
    if (text) lines.push({ text, offset: parseInt(m[1]) / 1000, duration: parseInt(m[2]) / 1000 });
  }
  return lines;
}

async function getTranscript(videoId: string): Promise<TranscriptLine[]> {
  // Strategy 1: innertube API
  try {
    const res = await axios.post(
      'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      { context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }, videoId },
      { headers: { 'Content-Type': 'application/json', 'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)' }, timeout: 10000 },
    );
    const tracks = res.data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (Array.isArray(tracks) && tracks.length) {
      const track = tracks.find((t: any) => t.languageCode === 'en') ||
                    tracks.find((t: any) => t.languageCode?.startsWith('en')) ||
                    tracks[0];
      if (track?.baseUrl) return await parseTrackXml(track.baseUrl);
    }
  } catch { /* fall through */ }

  // Strategy 2: page scrape
  try {
    const pageRes = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }, timeout: 12000,
    });
    const html = pageRes.data as string;
    const marker = 'ytInitialPlayerResponse = ';
    const start = html.indexOf(marker);
    if (start !== -1) {
      let depth = 0, i = start + marker.length;
      for (; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}' && --depth === 0) break;
      }
      const json = JSON.parse(html.slice(start + marker.length, i + 1));
      const tracks = json?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (tracks.length) {
        const track = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
        if (track?.baseUrl) return await parseTrackXml(track.baseUrl);
      }
    }
  } catch { /* no transcript */ }

  return [];
}

// ── Detection logic (mirrors moments-detection.service.ts) ────────────────────

function generateTitle(type: string, text: string, index: number): string {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 60);
  if (type === 'declaration') return clean.length > 10 ? `Declaration: "${clean}…"` : `Prophetic Declaration #${index + 1}`;
  if (type === 'prayer')      return clean.length > 10 ? `Prayer Moment: "${clean}…"` : `Prayer Session #${index + 1}`;
  return clean.length > 10 ? `Testimony: "${clean}…"` : `Testimony #${index + 1}`;
}

function detectDeclaration(transcript: TranscriptLine[], duration: number) {
  const windowStart = duration > 0 ? Math.max(duration - 600, duration * 0.70) : 0;
  const finalSection = transcript.filter(l => l.offset >= windowStart);
  if (!finalSection.length) return null;

  const candidates = finalSection.filter(l =>
    ALL_DECLARATION_KEYWORDS.some(kw => l.text.toLowerCase().includes(kw)),
  );
  if (!candidates.length) return null;

  const pick =
    candidates.find(l => DECLARATION_KEYWORDS_P1.some(kw => l.text.toLowerCase().includes(kw))) ??
    candidates.find(l => DECLARATION_KEYWORDS_P2.some(kw => l.text.toLowerCase().includes(kw))) ??
    candidates[0];

  const startTime = Math.max(Math.floor(pick.offset) - 15, 0);
  const endTime   = Math.floor(pick.offset) + 45;
  if (startTime < windowStart - 15) return null;

  return { type: 'declaration', startTime, endTime, text: pick.text };
}

function detectPrayer(transcript: TranscriptLine[]) {
  const candidates = transcript.filter(l =>
    ALL_PRAYER_KEYWORDS.some(kw => l.text.toLowerCase().includes(kw)),
  );
  if (!candidates.length) return null;

  const pick =
    candidates.find(l => PRAYER_KEYWORDS_P1.some(kw => l.text.toLowerCase().includes(kw))) ??
    candidates.find(l => PRAYER_KEYWORDS_P2.some(kw => l.text.toLowerCase().includes(kw))) ??
    candidates[0];

  return {
    type: 'prayer',
    startTime: Math.max(Math.floor(pick.offset) - 10, 0),
    endTime:   Math.floor(pick.offset) + 50,
    text: pick.text,
  };
}

function detectTestimonies(transcript: TranscriptLine[], max = 3) {
  const results: Array<{ type: string; startTime: number; endTime: number; text: string }> = [];
  for (const line of transcript) {
    if (results.length >= max) break;
    if (TESTIMONY_KEYWORDS.some(kw => line.text.toLowerCase().includes(kw))) {
      results.push({
        type: 'testimony',
        startTime: Math.max(Math.floor(line.offset) - 10, 0),
        endTime:   Math.floor(line.offset) + 40,
        text: line.text,
      });
    }
  }
  return results;
}

function deduplicate(moments: Array<{ type: string; startTime: number; endTime: number; text: string }>) {
  const grouped = new Map<string, typeof moments>();
  for (const m of moments) {
    if (!grouped.has(m.type)) grouped.set(m.type, []);
    grouped.get(m.type)!.push(m);
  }
  const result: typeof moments = [];
  for (const [, group] of grouped) {
    let lastEnd = -Infinity;
    for (const m of group.sort((a, b) => a.startTime - b.startTime)) {
      if (m.startTime > lastEnd + 30) { result.push(m); lastEnd = m.endTime; }
    }
  }
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await ds.initialize();
  console.log('✅ Connected to database\n');

  // 1. Clear existing moments
  const del = await ds.query('DELETE FROM moments');
  console.log(`🗑️  Cleared moments table (${del.affectedRows ?? 0} rows deleted)\n`);

  // 2. Fetch all processable videos
  const videos: Array<{
    id: number; youtubeId: string; title: string;
    thumbnailUrl: string | null; durationSeconds: number;
  }> = await ds.query(
    `SELECT id, youtube_id AS youtubeId, title, thumbnail_url AS thumbnailUrl,
            duration_seconds AS durationSeconds
     FROM videos
     WHERE is_live = 0 AND is_upcoming = 0
     ORDER BY published_at DESC`,
  );
  console.log(`📹  Found ${videos.length} videos to process\n`);

  let totalSaved = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const prefix = `[${i + 1}/${videos.length}] ${video.youtubeId}`;

    let transcript: TranscriptLine[];
    try {
      transcript = await getTranscript(video.youtubeId);
    } catch (e: any) {
      console.log(`${prefix} — transcript error: ${e.message}`);
      continue;
    }

    if (!transcript.length) {
      console.log(`${prefix} — no transcript`);
      continue;
    }

    const allMoments: Array<{ type: string; startTime: number; endTime: number; text: string }> = [];

    const declaration = detectDeclaration(transcript, video.durationSeconds);
    if (declaration) allMoments.push(declaration);

    const prayer = detectPrayer(transcript);
    if (prayer) allMoments.push(prayer);

    allMoments.push(...detectTestimonies(transcript, 3));

    if (!allMoments.length) {
      console.log(`${prefix} — 0 moments detected`);
      continue;
    }

    const deduped = deduplicate(allMoments);
    const rows: MomentRow[] = deduped.map((m, idx) => ({
      type:           m.type,
      title:          generateTitle(m.type, m.text, idx),
      youtubeId:      video.youtubeId,
      videoId:        video.id,
      startTime:      m.startTime,
      endTime:        m.endTime,
      thumbnailUrl:   video.thumbnailUrl,
      sermonTitle:    video.title,
      transcriptText: m.text,
    }));

    for (const row of rows) {
      await ds.query(
        `INSERT INTO moments
           (type, title, youtube_id, video_id, start_time, end_time, thumbnail_url, sermon_title, transcript_text, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [row.type, row.title, row.youtubeId, row.videoId, row.startTime, row.endTime,
         row.thumbnailUrl, row.sermonTitle, row.transcriptText],
      );
    }

    totalSaved += rows.length;
    const types = rows.map(r => r.type).join(', ');
    console.log(`${prefix} — saved ${rows.length} moments (${types})`);
  }

  console.log(`\n✅ Done! Total moments saved: ${totalSaved}`);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
