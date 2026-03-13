import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { YoutubeSyncService } from './youtube-sync.service';
import { CategorizationService } from './categorization.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLog } from './sync-log.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private sync: YoutubeSyncService,
    private categorization: CategorizationService,
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

  /**
   * POST /admin/categorize
   * Bulk-categorize existing videos using keyword matching.
   * ?force=true  — re-tag ALL videos (overwrites nothing, skips existing VideoCategory rows)
   * ?force=false — only tag videos that have zero categories yet (default)
   */
  @Post('categorize')
  categorizeAll(@Query('force') force?: string) {
    return this.categorization.categorizeAll(force === 'true');
  }
}
