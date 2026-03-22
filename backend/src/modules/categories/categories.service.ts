import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Category } from './category.entity';
import { VideoCategory, TaggedBy } from './video-category.entity';
import { Video } from '../videos/video.entity';

const TTL_CATEGORIES = 1_800_000; // 30 min

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)      private catRepo: Repository<Category>,
    @InjectRepository(VideoCategory) private vcRepo: Repository<VideoCategory>,
    @InjectRepository(Video)         private videoRepo: Repository<Video>,
    @Inject(CACHE_MANAGER)           private cache: Cache,
  ) {}

  async findAll() {
    const key = 'categories:all';
    try {
      const cached = await this.cache.get<any[]>(key);
      if (cached) {
        this.logger.debug('CACHE HIT  categories:all');
        return cached;
      }
    } catch { /* Redis unavailable — fall through to DB */ }

    this.logger.debug('CACHE MISS categories:all — fetching from DB');
    const cats = await this.catRepo.find({ order: { sortOrder: 'ASC' } });
    const result = await Promise.all(
      cats.map(async (c) => ({
        ...c,
        videoCount: await this.vcRepo.count({ where: { categoryId: c.id } }),
      })),
    );

    try { await this.cache.set(key, result, TTL_CATEGORIES); } catch { /* ignore */ }
    return result;
  }

  async findBySlug(slug: string) {
    const cat = await this.catRepo.findOne({ where: { slug } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async findVideosByCategory(slug: string, page = 1, limit = 20) {
    const cat = await this.findBySlug(slug);
    const [items, total] = await this.videoRepo
      .createQueryBuilder('v')
      .innerJoin('v.videoCategories', 'vc')
      .where('vc.categoryId = :id', { id: cat.id })
      .andWhere('v.isLive = false AND v.isUpcoming = false')
      .orderBy('v.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { category: cat, items, total, page, limit };
  }

  async create(data: Partial<Category>) {
    const result = await this.catRepo.save(this.catRepo.create(data));
    try { await this.cache.del('categories:all'); } catch { /* ignore */ }
    return result;
  }

  async assignCategories(videoId: number, categoryIds: number[]) {
    for (const catId of categoryIds) {
      const exists = await this.vcRepo.findOne({ where: { videoId, categoryId: catId } });
      if (!exists) {
        await this.vcRepo.save(
          this.vcRepo.create({ videoId, categoryId: catId, taggedBy: TaggedBy.MANUAL, confidenceScore: 1.0 }),
        );
      }
    }
    return { success: true };
  }
}
