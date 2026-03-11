import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { VideoCategory, TaggedBy } from '../categories/video-category.entity';
import { Category } from '../categories/category.entity';
import { Video } from '../videos/video.entity';

interface CategoryKeywords {
  [slug: string]: string[];
}

const CATEGORY_KEYWORDS: CategoryKeywords = {
  faith: [
    'faith', 'believe', 'belief', 'trust', 'salvation', 'grace', 'righteousness',
    'justified', 'sanctified', 'redemption', 'covenant', 'justified by faith',
  ],
  favor: [
    'favour', 'favor', 'blessing', 'blessed', 'abundance', 'prosperity', 'prosperous',
    'breakthrough', 'mercy', 'advantage', 'promotion', 'increase', 'open doors',
  ],
  prayer: [
    'prayer', 'pray', 'intercession', 'intercede', 'supplication', 'fasting',
    'fast', 'warfare', 'spiritual exercises', 'commune', 'petition', 'decree',
  ],
  'spiritual-growth': [
    'growth', 'transformation', 'maturity', 'discipline', 'character', 'intimacy',
    'anointing', 'consecration', 'holy spirit', 'sanctification', 'spiritual',
  ],
  wisdom: [
    'wisdom', 'understanding', 'knowledge', 'revelation', 'insight', 'discernment',
    'intelligence', 'counsel', 'strategy', 'prudence', 'shrewd', 'wise',
  ],
  relationships: [
    'marriage', 'family', 'relationship', 'love', 'friendship', 'fellowship',
    'community', 'unity', 'partnership', 'husband', 'wife', 'children',
  ],
  purpose: [
    'purpose', 'destiny', 'calling', 'mandate', 'assignment', 'vision', 'mission',
    'potential', 'greatness', 'glorify', 'fulfillment', 'called', 'anointed',
  ],
  deliverance: [
    'deliverance', 'freedom', 'bondage', 'victory', 'overcome', 'liberate',
    'stronghold', 'captive', 'free', 'chains', 'darkness', 'spiritual warfare',
  ],
};

// Pattern rules for known event types
const EVENT_PATTERNS: Array<{ pattern: RegExp; categories: string[] }> = [
  { pattern: /miracle service/i,        categories: ['prayer', 'faith'] },
  { pattern: /school of ministry|ksom/i, categories: ['wisdom', 'spiritual-growth'] },
  { pattern: /shout of the king/i,       categories: ['faith', 'favor'] },
  { pattern: /prophetic declaration/i,   categories: ['faith', 'purpose'] },
  { pattern: /sound of revival/i,        categories: ['spiritual-growth', 'faith'] },
  { pattern: /restoring the order/i,     categories: ['wisdom', 'spiritual-growth'] },
];

@Injectable()
export class CategorizationService {
  private readonly logger = new Logger(CategorizationService.name);

  constructor(
    @InjectRepository(VideoCategory)
    private vcRepo: Repository<VideoCategory>,
    @InjectRepository(Category)
    private catRepo: Repository<Category>,
    private config: ConfigService,
  ) {}

  async autoTag(video: Video): Promise<void> {
    const text = `${video.title} ${(video.description || '').slice(0, 500)}`.toLowerCase();
    const scored = new Map<string, number>();

    // Layer 1: Keyword matching
    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let hits = 0;
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) hits++;
      }
      if (hits >= 2) {
        const score = Math.min(0.70 + (hits - 2) * 0.05, 1.0);
        scored.set(slug, score);
      }
    }

    // Layer 2: Pattern rules
    for (const { pattern, categories } of EVENT_PATTERNS) {
      if (pattern.test(video.title)) {
        for (const slug of categories) {
          if (!scored.has(slug)) scored.set(slug, 0.95);
        }
      }
    }

    if (scored.size === 0) {
      this.logger.debug(`No categories found for video: ${video.title}`);
      return;
    }

    const categories = await this.catRepo.find();
    const catMap = new Map(categories.map((c) => [c.slug, c]));

    for (const [slug, score] of scored.entries()) {
      const cat = catMap.get(slug);
      if (!cat) continue;

      const existing = await this.vcRepo.findOne({
        where: { videoId: video.id, categoryId: cat.id },
      });
      if (existing) continue;

      await this.vcRepo.save(
        this.vcRepo.create({
          videoId: video.id,
          categoryId: cat.id,
          confidenceScore: score,
          taggedBy: TaggedBy.KEYWORD,
        }),
      );
    }

    this.logger.debug(
      `Tagged video ${video.id} with ${scored.size} categories`,
    );
  }
}
