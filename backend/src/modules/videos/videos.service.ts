import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Build a base query that only selects video IDs to get a correct count
    // (leftJoinAndSelect + take/skip inflates counts due to row duplication)
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
    const idRows = await idQb.offset((page - 1) * limit).limit(limit).getRawMany<{ id: number }>();
    const ids = idRows.map((r) => r.id);

    if (!ids.length) {
      return { items: [], total, page, limit, pages: Math.ceil(total / limit) };
    }

    // Fetch full records for the current page IDs, preserving order
    const itemMap = new Map<number, Video>();
    const items = await this.repo.findByIds(ids);
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
