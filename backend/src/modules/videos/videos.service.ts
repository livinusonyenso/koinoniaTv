import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Video } from './video.entity';

const TTL_LATEST   = 300_000;   //  5 min
const TTL_TRENDING = 900_000;   // 15 min

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video) private repo: Repository<Video>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    year?: number;
    sort?: 'latest' | 'trending' | 'az';
  }) {
    const { page = 1, limit = 20, category, year, sort = 'latest' } = query;

    const idQb = this.repo
      .createQueryBuilder('v')
      .select('v.id', 'id')
      .where('v.isLive = :live AND v.isUpcoming = :upcoming', { live: false, upcoming: false });

    if (category) {
      idQb
        .innerJoin('v.videoCategories', 'vc')
        .innerJoin('vc.category', 'c')
        .andWhere('c.slug = :category', { category });
    }
    if (year) idQb.andWhere('YEAR(v.publishedAt) = :year', { year });

    if (sort === 'trending') idQb.orderBy('v.viewCount', 'DESC');
    else if (sort === 'az') idQb.orderBy('v.title', 'ASC');
    else idQb.orderBy('v.publishedAt', 'DESC');

    const total = await idQb.getCount();
    const idRows = await idQb.offset((page - 1) * limit).limit(limit).getRawMany<{ id: string | number }>();
    const ids = idRows.map((r) => +r.id);

    if (!ids.length) {
      return { items: [], total, page, limit, pages: Math.ceil(total / limit) };
    }

    const itemMap = new Map<number, Video>();
    const items = await this.repo.findBy({ id: In(ids) });
    items.forEach((v) => itemMap.set(v.id, v));
    const ordered = ids.map((id) => itemMap.get(id)).filter(Boolean) as Video[];

    return { items: ordered, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Video> {
    const video = await this.repo.findOne({
      where: { id },
      relations: ['videoCategories', 'videoCategories.category'],
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async findFeatured(): Promise<Video[]> {
    return this.repo.find({
      where: { isFeatured: true },
      relations: ['videoCategories', 'videoCategories.category'],
      order: { publishedAt: 'DESC' },
      take: 10,
    });
  }

  async findLatest(limit = 10): Promise<Video[]> {
    const key = 'videos:latest';
    try {
      const cached = await this.cache.get<Video[]>(key);
      if (cached) {
        this.logger.debug('CACHE HIT  videos:latest');
        return cached;
      }
    } catch { /* Redis unavailable — fall through to DB */ }

    this.logger.debug('CACHE MISS videos:latest — fetching from DB');
    const result = await this.repo.find({
      where: { isLive: false, isUpcoming: false },
      relations: ['videoCategories', 'videoCategories.category'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });

    try { await this.cache.set(key, result, TTL_LATEST); } catch { /* ignore */ }
    return result;
  }

  async findTrending(limit = 10): Promise<Video[]> {
    const key = 'videos:trending';
    try {
      const cached = await this.cache.get<Video[]>(key);
      if (cached) {
        this.logger.debug('CACHE HIT  videos:trending');
        return cached;
      }
    } catch { /* Redis unavailable — fall through to DB */ }

    this.logger.debug('CACHE MISS videos:trending — fetching from DB');
    const result = await this.repo.find({
      where: { isLive: false, isUpcoming: false },
      order: { viewCount: 'DESC' },
      take: limit,
    });

    try { await this.cache.set(key, result, TTL_TRENDING); } catch { /* ignore */ }
    return result;
  }

  async findRelated(videoId: number, limit = 6): Promise<Video[]> {
    const video = await this.findOne(videoId);
    const catIds = video.videoCategories.map((vc) => vc.categoryId);
    if (!catIds.length) return this.findLatest(limit);

    return this.repo
      .createQueryBuilder('v')
      .innerJoin('v.videoCategories', 'vc')
      .where('vc.categoryId IN (:...catIds)', { catIds })
      .andWhere('v.id != :id', { id: videoId })
      .orderBy('v.publishedAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async search(q: string, page = 1, limit = 20) {
    const qb = this.repo
      .createQueryBuilder('v')
      .where('v.title LIKE :q OR v.description LIKE :q', { q: `%${q}%` })
      .andWhere('v.isLive = false AND v.isUpcoming = false')
      .orderBy('v.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  /** Called by YoutubeSyncService after saving new videos */
  async invalidateVideoCache(): Promise<void> {
    try {
      await this.cache.del('videos:latest');
      await this.cache.del('videos:trending');
      this.logger.debug('Cache invalidated: videos:latest, videos:trending');
    } catch { /* ignore */ }
  }
}
