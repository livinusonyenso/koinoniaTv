import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../videos/video.entity';

@Injectable()
export class LiveService {
  constructor(@InjectRepository(Video) private repo: Repository<Video>) {}

  async getStatus() {
    const live = await this.repo.find({ where: { isLive: true }, take: 1 });
    return {
      isLive: live.length > 0,
      stream: live[0] || null,
    };
  }

  async getStream() {
    const live = await this.repo.findOne({ where: { isLive: true } });
    if (!live) return { isLive: false };
    return {
      isLive: true,
      youtubeId: live.youtubeId,
      title: live.title,
      thumbnailUrl: live.thumbnailUrl,
      embedUrl: `https://www.youtube.com/embed/${live.youtubeId}?autoplay=1`,
    };
  }

  async getUpcoming() {
    return this.repo.find({
      where: { isUpcoming: true },
      order: { scheduledStart: 'ASC' },
      take: 5,
    });
  }
}
