import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
