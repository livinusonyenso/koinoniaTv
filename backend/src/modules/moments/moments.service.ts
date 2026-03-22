import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Moment, MomentType } from './moment.entity';

// Declarations are static content — cache aggressively
const TTL_DECLARATIONS = 600_000;  // 10 min
const TTL_PRAYERS      = 300_000;  //  5 min
const TTL_TESTIMONIES  = 300_000;  //  5 min

function cacheKeyForType(type: MomentType): string {
  return `moments:${type}`;
}

@Injectable()
export class MomentsService {
  private readonly logger = new Logger(MomentsService.name);

  constructor(
    @InjectRepository(Moment) private repo: Repository<Moment>,
    @Inject(CACHE_MANAGER)    private cache: Cache,
  ) {}

  async findByType(type: MomentType, page = 1, limit = 20) {
    // Only cache page 1 — deeper pages are rare and not worth the memory
    const shouldCache = page === 1;
    const key = cacheKeyForType(type);

    if (shouldCache) {
      try {
        const cached = await this.cache.get<any>(key);
        if (cached) {
          this.logger.debug(`CACHE HIT  ${key}`);
          return cached;
        }
      } catch { /* Redis unavailable — fall through to DB */ }
      this.logger.debug(`CACHE MISS ${key} — fetching from DB`);
    }

    const [items, total] = await this.repo.findAndCount({
      where: { type },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const result = { items, total, page, limit, pages: Math.ceil(total / limit) };

    if (shouldCache) {
      const ttl =
        type === MomentType.DECLARATION ? TTL_DECLARATIONS :
        type === MomentType.PRAYER      ? TTL_PRAYERS      :
        TTL_TESTIMONIES;
      try { await this.cache.set(key, result, ttl); } catch { /* ignore */ }
    }

    return result;
  }

  findAll(page = 1, limit = 20) {
    return this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    }).then(([items, total]) => ({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }));
  }

  async findSuggestions(momentId: number, youtubeId: string, type: MomentType, limit = 8) {
    const sameVideo = await this.repo.find({
      where: { youtubeId, id: Not(momentId) },
      order: { startTime: 'ASC' },
      take: limit,
    });

    if (sameVideo.length >= limit) return sameVideo.slice(0, limit);

    const remaining = limit - sameVideo.length;
    const sameType = await this.repo
      .createQueryBuilder('m')
      .where('m.type = :type', { type })
      .andWhere('m.youtubeId != :youtubeId', { youtubeId })
      .andWhere('m.id != :id', { id: momentId })
      .orderBy('m.createdAt', 'DESC')
      .take(remaining)
      .getMany();

    return [...sameVideo, ...sameType];
  }
}
