import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { VideoCategory, TaggedBy } from './video-category.entity';
import { Video } from '../videos/video.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)      private catRepo: Repository<Category>,
    @InjectRepository(VideoCategory) private vcRepo: Repository<VideoCategory>,
    @InjectRepository(Video)         private videoRepo: Repository<Video>,
  ) {}

  async findAll() {
    const cats = await this.catRepo.find({ order: { sortOrder: 'ASC' } });
    return Promise.all(
      cats.map(async (c) => ({
        ...c,
        videoCount: await this.vcRepo.count({ where: { categoryId: c.id } }),
      })),
    );
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
    return this.catRepo.save(this.catRepo.create(data));
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
