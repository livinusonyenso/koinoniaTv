import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoCategory, TaggedBy } from '../categories/video-category.entity';
import { Category } from '../categories/category.entity';
import { Video } from '../videos/video.entity';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  faith: [
    'faith', 'believe', 'belief', 'trust', 'salvation', 'grace', 'righteousness',
    'justified', 'sanctified', 'redemption', 'covenant',
  ],
  favor: [
    'favour', 'favor', 'blessing', 'blessed', 'abundance', 'prosperity', 'prosperous',
    'breakthrough', 'mercy', 'advantage', 'promotion', 'increase', 'open doors',
  ],
  prayer: [
    'prayer', 'pray', 'intercession', 'intercede', 'supplication', 'fasting',
    'fast', 'warfare', 'commune', 'petition', 'decree',
  ],
  'spiritual-growth': [
    'growth', 'transformation', 'maturity', 'discipline', 'character', 'intimacy',
    'anointing', 'consecration', 'holy spirit', 'sanctification', 'spiritual',
  ],
  wisdom: [
    'wisdom', 'understanding', 'knowledge', 'revelation', 'insight', 'discernment',
    'intelligence', 'counsel', 'strategy', 'prudence', 'wise',
  ],
  relationships: [
    'marriage', 'family', 'relationship', 'love', 'friendship', 'fellowship',
    'community', 'unity', 'partnership', 'husband', 'wife', 'children',
  ],
  purpose: [
    'purpose', 'destiny', 'calling', 'mandate', 'assignment', 'vision', 'mission',
    'potential', 'greatness', 'fulfillment', 'called', 'anointed',
  ],
  deliverance: [
    'deliverance', 'freedom', 'bondage', 'victory', 'overcome', 'liberate',
    'stronghold', 'captive', 'chains', 'darkness', 'spiritual warfare',
  ],
};

// Pattern-based rules for recurring event titles (high-confidence)
const EVENT_PATTERNS: Array<{ pattern: RegExp; categories: string[] }> = [
  { pattern: /miracle service/i,          categories: ['prayer', 'faith']              },
  { pattern: /school of ministry|ksom/i,  categories: ['wisdom', 'spiritual-growth']   },
  { pattern: /shout of the king/i,        categories: ['faith', 'favor']               },
  { pattern: /prophetic declaration/i,    categories: ['faith', 'purpose']             },
  { pattern: /sound of revival/i,         categories: ['spiritual-growth', 'faith']    },
  { pattern: /restoring the order/i,      categories: ['wisdom', 'spiritual-growth']   },
  { pattern: /healing to the nations/i,   categories: ['faith', 'deliverance']         },
  { pattern: /power of the word/i,        categories: ['spiritual-growth', 'wisdom']   },
  { pattern: /mystery of/i,               categories: ['wisdom']                       },
  { pattern: /understanding (the|your)/i, categories: ['wisdom']                       },
];

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);

  constructor(
    @InjectRepository(VideoCategory) private vcRepo: Repository<VideoCategory>,
    @InjectRepository(Category)      private catRepo: Repository<Category>,
    @InjectRepository(Video)         private videoRepo: Repository<Video>,
  ) {}

  // ── Tag a single video ────────────────────────────────────────────────────
  async autoTag(video: Video): Promise<number> {
    const text = `${video.title} ${(video.description || '').slice(0, 600)}`.toLowerCase();
    const scored = new Map<string, number>();

    // Layer 1: Keyword matching — threshold lowered to 1 hit
    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let hits = 0;
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) hits++;
      }
      if (hits >= 1) {
        // 1 hit = 0.65, 2 hits = 0.70, 3+ hits = capped at 0.95
        const score = Math.min(0.60 + hits * 0.10, 0.95);
        scored.set(slug, score);
      }
    }

    // Layer 2: Event pattern rules override / supplement keyword matches
    for (const { pattern, categories } of EVENT_PATTERNS) {
      if (pattern.test(video.title)) {
        for (const slug of categories) {
          scored.set(slug, Math.max(scored.get(slug) ?? 0, 0.95));
        }
      }
    }

    if (scored.size === 0) {
      this.logger.verbose(`No category match for: "${video.title}"`);
      return 0;
    }

    const allCats  = await this.catRepo.find();
    const catMap   = new Map(allCats.map((c) => [c.slug, c]));
    let saved = 0;

    for (const [slug, score] of scored.entries()) {
      const cat = catMap.get(slug);
      if (!cat) continue;

      const exists = await this.vcRepo.findOne({
        where: { videoId: video.id, categoryId: cat.id },
      });
      if (exists) continue;

      await this.vcRepo.save(
        this.vcRepo.create({
          videoId: video.id,
          categoryId: cat.id,
          confidenceScore: score,
          taggedBy: TaggedBy.KEYWORD,
        }),
      );
      saved++;
    }

    if (saved > 0) {
      this.logger.debug(`Video ${video.id} tagged with ${saved} new categories`);
    }
    return saved;
  }

  // ── Bulk categorize all videos that have no categories yet ────────────────
  async categorizeAll(force = false): Promise<{ processed: number; tagged: number; skipped: number }> {
    const videos = await this.videoRepo.find({ select: ['id', 'title', 'description'] });
    let processed = 0, tagged = 0, skipped = 0;

    for (const video of videos) {
      if (!force) {
        const existing = await this.vcRepo.count({ where: { videoId: video.id } });
        if (existing > 0) { skipped++; continue; }
      }
      const added = await this.autoTag(video);
      if (added > 0) tagged++;
      processed++;
    }

    this.logger.log(
      `categorizeAll: processed=${processed}, tagged=${tagged}, skipped=${skipped}`,
    );
    return { processed, tagged, skipped };
  }
}
