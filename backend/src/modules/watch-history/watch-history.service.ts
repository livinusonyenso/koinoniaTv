import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchHistory } from './watch-history.entity';

@Injectable()
export class WatchHistoryService {
  constructor(@InjectRepository(WatchHistory) private repo: Repository<WatchHistory>) {}

  async findAll(userId: number, page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      relations: ['video'],
      order: { watchedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async saveProgress(userId: number, videoId: number, progressSeconds: number) {
    const existing = await this.repo.findOne({ where: { userId, videoId } });
    if (existing) {
      existing.progressSeconds = progressSeconds;
      existing.completed = progressSeconds > 0; // simplified; check duration for real completion
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ userId, videoId, progressSeconds }));
  }

  async getProgress(userId: number, videoId: number) {
    const history = await this.repo.findOne({ where: { userId, videoId } });
    return { progressSeconds: history?.progressSeconds || 0, completed: history?.completed || false };
  }
}
