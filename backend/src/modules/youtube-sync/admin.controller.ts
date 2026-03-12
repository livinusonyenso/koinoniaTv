import { Controller, Post, Get, Body } from '@nestjs/common';
import { YoutubeSyncService } from './youtube-sync.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLog } from './sync-log.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private sync: YoutubeSyncService,
    @InjectRepository(SyncLog) private logRepo: Repository<SyncLog>,
  ) {}

  @Post('sync/trigger')
  trigger(@Body('type') type: 'full' | 'incremental' = 'incremental') {
    return this.sync.triggerManualSync(type);
  }

  @Get('sync/logs')
  getLogs() {
    return this.logRepo.find({ order: { startedAt: 'DESC' }, take: 20 });
  }
}
