import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moment, MomentType } from './moment.entity';
import { Video } from '../videos/video.entity';
import { TranscriptService, TranscriptLine } from '../youtube-sync/transcript.service';

// ── Keyword Dictionaries ─────────────────────────────────────────────────────

const DECLARATION_KEYWORDS = [
  'i declare',
  'i decree',
  'receive it',
  'let it be established',
  'i speak over your life',
  'receive grace',
  'take it now',
  'in the name of jesus',
  'i command',
  'be released',
  'be healed',
  'receive healing',
  'i prophesy',
  'thus saith the lord',
  'it is established',
  'receive your miracle',
  'fire of god',
];

const PRAYER_KEYWORDS = [
  'lift your voice and pray',
  'let us pray',
  'pray in the spirit',
  'open your mouth and pray',
  'begin to pray',
  'pray this prayer',
  'make this declaration',
  'say after me',
  'pray with me',
  'close your eyes',
  'father in heaven',
  'lord we thank you',
  'heavenly father',
  'dear lord',
  'we come before you',
  'father lord',
];

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

    const allMoments = [
      ...this.detect(transcript, DECLARATION_KEYWORDS, MomentType.DECLARATION),
      ...this.detect(transcript, PRAYER_KEYWORDS, MomentType.PRAYER),
      ...this.detect(transcript, TESTIMONY_KEYWORDS, MomentType.TESTIMONY),
    ];

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

  // ── Detection logic ───────────────────────────────────────────────────────

  private detect(
    transcript: TranscriptLine[],
    keywords: string[],
    type: MomentType,
  ): Array<{ type: MomentType; startTime: number; endTime: number; text: string }> {
    const results: Array<{ type: MomentType; startTime: number; endTime: number; text: string }> = [];

    for (const line of transcript) {
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
