import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './bookmark.entity';

@Injectable()
export class BookmarksService {
  constructor(@InjectRepository(Bookmark) private repo: Repository<Bookmark>) {}

  async findAll(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      relations: ['video', 'video.videoCategories', 'video.videoCategories.category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async add(userId: number, videoId: number) {
    const existing = await this.repo.findOne({ where: { userId, videoId } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ userId, videoId }));
  }

  async remove(userId: number, videoId: number) {
    return this.repo.delete({ userId, videoId });
  }

  async isBookmarked(userId: number, videoId: number) {
    const exists = await this.repo.findOne({ where: { userId, videoId } });
    return { bookmarked: !!exists };
  }
}
