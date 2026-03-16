import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrayerRequest } from './prayer-request.entity';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';

/** Strip HTML tags to prevent XSS storage. */
function sanitize(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

@Injectable()
export class PrayerRequestsService {
  constructor(
    @InjectRepository(PrayerRequest)
    private readonly repo: Repository<PrayerRequest>,
  ) {}

  create(dto: CreatePrayerRequestDto, userId?: string): Promise<PrayerRequest> {
    const entity = this.repo.create({
      name:     sanitize(dto.name),
      category: dto.category,
      request:  sanitize(dto.request),
      userId,
    });
    return this.repo.save(entity);
  }

  async findAll(page = 1, limit = 20): Promise<{
    data: PrayerRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { data, total, page, limit };
  }
}
