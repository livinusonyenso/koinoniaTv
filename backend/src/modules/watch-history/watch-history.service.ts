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

  async saveProgress(userId: number, videoId: number, progressSeconds: number, totalSeconds?: number) {
    const isCompleted = totalSeconds
      ? progressSeconds >= totalSeconds * 0.9
      : false;

    const existing = await this.repo.findOne({ where: { userId, videoId } });
    if (existing) {
      // Never decrease progress — re-opening a video must not wipe saved position
      if (progressSeconds > existing.progressSeconds) {
        existing.progressSeconds = progressSeconds;
      }
      if (isCompleted) existing.completed = true;
      // Always save so @UpdateDateColumn (watchedAt) refreshes — moves item to top of history
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({ userId, videoId, progressSeconds, completed: isCompleted }),
    );
  }

  async getProgress(userId: number, videoId: number) {
    const history = await this.repo.findOne({ where: { userId, videoId } });
    return { progressSeconds: history?.progressSeconds || 0, completed: history?.completed || false };
  }
}
