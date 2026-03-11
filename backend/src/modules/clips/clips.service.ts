import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clip } from './clip.entity';

@Injectable()
export class ClipsService {
  constructor(@InjectRepository(Clip) private repo: Repository<Clip>) {}

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.repo.findAndCount({
      relations: ['video'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findFeatured() {
    return this.repo.find({
      where: { isFeatured: true },
      relations: ['video'],
      order: { createdAt: 'DESC' },
      take: 10,
    });
  }

  async findOne(id: number) {
    const clip = await this.repo.findOne({ where: { id }, relations: ['video'] });
    if (!clip) throw new NotFoundException('Clip not found');
    return clip;
  }

  async incrementShare(id: number) {
    await this.findOne(id);
    await this.repo.increment({ id }, 'shareCount', 1);
    const clip = await this.findOne(id);
    return {
      shareCount: clip.shareCount,
      shareUrl: `https://koinoniatv.app/clips/${id}`,
    };
  }

  async create(data: Partial<Clip>) {
    return this.repo.save(this.repo.create(data));
  }
}
