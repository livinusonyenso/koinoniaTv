import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('jwt'))
  trigger(@Body('type') type: 'full' | 'incremental' = 'incremental') {
    return this.sync.triggerManualSync(type);
  }

  @Get('sync/logs')
  @UseGuards(AuthGuard('jwt'))
  getLogs() {
    return this.logRepo.find({ order: { startedAt: 'DESC' }, take: 20 });
  }
}
