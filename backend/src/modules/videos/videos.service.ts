import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Video } from './video.entity';

@Injectable()
export class VideosService {
  constructor(@InjectRepository(Video) private repo: Repository<Video>) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    year?: number;
    sort?: 'latest' | 'trending' | 'az';
  }) {
    const { page = 1, limit = 20, category, year, sort = 'latest' } = query;
    const qb = this.repo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.videoCategories', 'vc')
      .leftJoinAndSelect('vc.category', 'c')
      .where('v.isLive = false AND v.isUpcoming = false');

    if (category) qb.andWhere('c.slug = :category', { category });
    if (year) qb.andWhere('YEAR(v.publishedAt) = :year', { year });

    if (sort === 'trending') qb.orderBy('v.viewCount', 'DESC');
    else if (sort === 'az') qb.orderBy('v.title', 'ASC');
    else qb.orderBy('v.publishedAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
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
    return this.repo.find({
      where: { isLive: false, isUpcoming: false },
      relations: ['videoCategories', 'videoCategories.category'],
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async findTrending(limit = 10): Promise<Video[]> {
    return this.repo.find({
      where: { isLive: false, isUpcoming: false },
      order: { viewCount: 'DESC' },
      take: limit,
    });
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
}
