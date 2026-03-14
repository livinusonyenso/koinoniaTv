import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Moment, MomentType } from './moment.entity';

@Injectable()
export class MomentsService {
  constructor(@InjectRepository(Moment) private repo: Repository<Moment>) {}

  findByType(type: MomentType, page = 1, limit = 20) {
    return this.repo.findAndCount({
      where: { type },
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

  /**
   * Suggestions for a given moment clip.
   * Priority 1: other moments from the same video (any type)
   * Priority 2: same type from other videos
   * Returns up to `limit` total, excluding the current moment.
   */
  async findSuggestions(momentId: number, youtubeId: string, type: MomentType, limit = 8) {
    // P1 – same video, any type, exclude self
    const sameVideo = await this.repo.find({
      where: { youtubeId, id: Not(momentId) },
      order: { startTime: 'ASC' },
      take: limit,
    });

    if (sameVideo.length >= limit) return sameVideo.slice(0, limit);

    // P2 – same type, different video, fill the rest
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
