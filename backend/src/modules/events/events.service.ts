import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {}

  async findAll(type?: string) {
    const qb = this.repo.createQueryBuilder('e').orderBy('e.startDatetime', 'ASC');
    if (type) qb.where('e.eventType = :type', { type });
    return qb.getMany();
  }

  async findUpcoming(limit = 5) {
    return this.repo.find({
      where: { startDatetime: MoreThan(new Date()) },
      order: { startDatetime: 'ASC' },
      take: limit,
    });
  }

  async findOne(id: number) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async getCountdown(id: number) {
    const event = await this.findOne(id);
    const msRemaining = event.startDatetime.getTime() - Date.now();
    if (msRemaining <= 0) return { started: true, msRemaining: 0 };
    const s = Math.floor(msRemaining / 1000);
    return {
      started: false,
      msRemaining,
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
    };
  }

  async create(data: Partial<Event>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<Event>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
  async remove(id: number) { return this.repo.delete(id); }
}
