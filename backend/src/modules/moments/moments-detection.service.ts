import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moment, MomentType } from './moment.entity';
import { Video } from '../videos/video.entity';
import { TranscriptService, TranscriptLine } from '../youtube-sync/transcript.service';

// ── Keyword Dictionaries ─────────────────────────────────────────────────────

// Priority-ordered — first matching group wins when multiple lines are found.
// Only phrases Apostle Selman uses to bless the congregation / the week.
const DECLARATION_KEYWORDS_P1 = ['this week', 'this week you will', 'this week you shall'];
const DECLARATION_KEYWORDS_P2 = ['i declare', 'i decree', 'i speak over your life', 'i prophesy'];
const DECLARATION_KEYWORDS_P3 = [
  'receive it', 'be blessed', 'it is done', 'in the name of jesus',
  'may the lord', 'let it be established', 'receive grace',
  'receive your miracle', 'it is established',
];
// Combined for fast "any match" check
const ALL_DECLARATION_KEYWORDS = [
  ...DECLARATION_KEYWORDS_P1,
  ...DECLARATION_KEYWORDS_P2,
  ...DECLARATION_KEYWORDS_P3,
];

// Priority-ordered for prayer selection (1 per video)
const PRAYER_KEYWORDS_P1 = ['lift your voice and pray', 'open your mouth and pray', 'pray with me', 'let us pray'];
const PRAYER_KEYWORDS_P2 = ['pray in the spirit', 'begin to pray', 'pray this prayer', 'say after me'];
const PRAYER_KEYWORDS_P3 = ['father lord', 'heavenly father', 'dear lord', 'we come before you'];
const ALL_PRAYER_KEYWORDS = [...PRAYER_KEYWORDS_P1, ...PRAYER_KEYWORDS_P2, ...PRAYER_KEYWORDS_P3];

const TESTIMONY_KEYWORDS = [
  'someone shared a testimony',
  'a testimony came',
  'this person testified',
  'i received a testimony',
  'listen to this testimony',
  'a lady shared',
  'a man shared',
  'they wrote to us',
  'testimony of',
  'testified that',
  'a brother',
  'a sister',
  'she was healed',
  'he was healed',
  'the doctor said',
  'they told me',
  'miracle happened',
];

// ── Title generators ─────────────────────────────────────────────────────────

function generateTitle(type: MomentType, text: string, index: number): string {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, 60);
  if (type === MomentType.DECLARATION) {
    return clean.length > 10 ? `Declaration: "${clean}…"` : `Prophetic Declaration #${index + 1}`;
  }
  if (type === MomentType.PRAYER) {
    return clean.length > 10 ? `Prayer Moment: "${clean}…"` : `Prayer Session #${index + 1}`;
  }
  return clean.length > 10 ? `Testimony: "${clean}…"` : `Testimony #${index + 1}`;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MomentsDetectionService {
  private readonly logger = new Logger(MomentsDetectionService.name);

  constructor(
    @InjectRepository(Moment) private momentRepo: Repository<Moment>,
    private transcriptSvc: TranscriptService,
  ) {}

  // Process a single video and store detected moments
  async processVideo(video: Video): Promise<number> {
    // Skip if already processed
    const existing = await this.momentRepo.count({ where: { videoId: video.id } });
    if (existing > 0) return 0;

    const transcript = await this.transcriptSvc.getTranscript(video.youtubeId);
    if (!transcript.length) {
      this.logger.debug(`No transcript for video ${video.youtubeId}`);
      return 0;
    }

    const allMoments: Array<{ type: MomentType; startTime: number; endTime: number; text: string }> = [];

    // ── Declaration: at most ONE per video, from final section ──
    const declaration = this.detectDeclaration(transcript, video.durationSeconds);
    if (declaration) allMoments.push(declaration);

    // ── Prayer: at most ONE per video, priority-based ─────────────────────
    const prayer = this.detectPrayer(transcript);
    if (prayer) allMoments.push(prayer);

    // ── Testimony: up to 3 per video, well-spaced ────────────────────────
    allMoments.push(...this.detect(transcript, TESTIMONY_KEYWORDS, MomentType.TESTIMONY, 3));

    if (!allMoments.length) return 0;

    const deduplicated = this.deduplicate(allMoments);
    let saved = 0;

    for (const [i, m] of deduplicated.entries()) {
      await this.momentRepo.save(
        this.momentRepo.create({
          type: m.type,
          title: generateTitle(m.type, m.text, i),
          youtubeId: video.youtubeId,
          videoId: video.id,
          startTime: m.startTime,
          endTime: m.endTime,
          thumbnailUrl: video.thumbnailUrl,
          sermonTitle: video.title,
          transcriptText: m.text,
        }),
      );
      saved++;
    }

    this.logger.log(
      `Video ${video.youtubeId}: saved ${saved} moments (${transcript.length} lines scanned)`,
    );
    return saved;
  }

  // ── Bulk process all videos that have no moments yet ─────────────────────
  async processAll(limit = 50): Promise<{ processed: number; momentsFound: number }> {
    // Get videos that haven't been processed yet
    const videos = await this.momentRepo.manager
      .createQueryBuilder(Video, 'v')
      .leftJoin('moments', 'm', 'm.video_id = v.id')
      .where('m.id IS NULL')
      .andWhere('v.isLive = false AND v.isUpcoming = false')
      .orderBy('v.publishedAt', 'DESC')
      .take(limit)
      .getMany();

    let processed = 0, momentsFound = 0;

    for (const video of videos) {
      const found = await this.processVideo(video);
      processed++;
      momentsFound += found;
    }

    return { processed, momentsFound };
  }

  // ── Declaration: strict one-per-video from final section ─────────────────

  private detectDeclaration(
    transcript: TranscriptLine[],
    videoDuration: number,
  ): { type: MomentType; startTime: number; endTime: number; text: string } | null {

    // Window: last 10 min; for short sermons use final 30%
    const windowStart = videoDuration > 0
      ? Math.max(videoDuration - 600, videoDuration * 0.70)
      : 0;

    const finalSection = transcript.filter((l) => l.offset >= windowStart);

    this.logger.verbose(
      `Declaration window ${Math.round(windowStart)}s–${videoDuration}s → ${finalSection.length} lines`,
    );

    if (!finalSection.length) return null;

    // Collect all candidate lines (any keyword match)
    const candidates = finalSection.filter((l) =>
      ALL_DECLARATION_KEYWORDS.some((kw) => l.text.toLowerCase().includes(kw)),
    );

    if (!candidates.length) return null;

    // Priority selection: P1 → P2 → P3 → first candidate
    const pick =
      candidates.find((l) => DECLARATION_KEYWORDS_P1.some((kw) => l.text.toLowerCase().includes(kw))) ??
      candidates.find((l) => DECLARATION_KEYWORDS_P2.some((kw) => l.text.toLowerCase().includes(kw))) ??
      candidates[0];

    const startTime = Math.max(Math.floor(pick.offset) - 15, 0);
    const endTime   = Math.floor(pick.offset) + 45;

    // Safety: clip must sit inside the declaration window
    if (startTime < windowStart - 15) return null;

    return { type: MomentType.DECLARATION, startTime, endTime, text: pick.text };
  }

  // ── Prayer: strict one-per-video, priority-based ──────────────────────────

  private detectPrayer(
    transcript: TranscriptLine[],
  ): { type: MomentType; startTime: number; endTime: number; text: string } | null {

    const candidates = transcript.filter((l) =>
      ALL_PRAYER_KEYWORDS.some((kw) => l.text.toLowerCase().includes(kw)),
    );

    if (!candidates.length) return null;

    // Priority selection: P1 → P2 → P3 → first candidate
    const pick =
      candidates.find((l) => PRAYER_KEYWORDS_P1.some((kw) => l.text.toLowerCase().includes(kw))) ??
      candidates.find((l) => PRAYER_KEYWORDS_P2.some((kw) => l.text.toLowerCase().includes(kw))) ??
      candidates[0];

    return {
      type: MomentType.PRAYER,
      startTime: Math.max(Math.floor(pick.offset) - 10, 0),
      endTime:   Math.floor(pick.offset) + 50,
      text: pick.text,
    };
  }

  // ── Generic multi-match detection (testimony) ─────────────────────────────

  private detect(
    transcript: TranscriptLine[],
    keywords: string[],
    type: MomentType,
    maxResults = 10,
  ): Array<{ type: MomentType; startTime: number; endTime: number; text: string }> {
    const results: Array<{ type: MomentType; startTime: number; endTime: number; text: string }> = [];

    for (const line of transcript) {
      if (results.length >= maxResults) break;
      const lower = line.text.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        results.push({
          type,
          startTime: Math.max(Math.floor(line.offset) - 10, 0),
          endTime:   Math.floor(line.offset) + 40,
          text: line.text,
        });
      }
    }
    return results;
  }

  // Remove moments within 30s of each other (same type) to avoid duplicate clips
  private deduplicate(
    moments: Array<{ type: MomentType; startTime: number; endTime: number; text: string }>,
  ) {
    const grouped = new Map<MomentType, typeof moments>();
    for (const m of moments) {
      if (!grouped.has(m.type)) grouped.set(m.type, []);
      grouped.get(m.type)!.push(m);
    }

    const result: typeof moments = [];
    for (const [, group] of grouped) {
      let lastEnd = -Infinity;
      for (const m of group.sort((a, b) => a.startTime - b.startTime)) {
        if (m.startTime > lastEnd + 30) {
          result.push(m);
          lastEnd = m.endTime;
        }
      }
    }
    return result;
  }
}
