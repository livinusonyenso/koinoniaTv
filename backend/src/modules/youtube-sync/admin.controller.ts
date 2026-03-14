import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { YoutubeSyncService } from './youtube-sync.service';
import { CategorizationService } from './categorization.service';
import { MomentsDetectionService } from '../moments/moments-detection.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLog } from './sync-log.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private sync: YoutubeSyncService,
    private categorization: CategorizationService,
    private momentsDetection: MomentsDetectionService,
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

  /**
   * POST /admin/moments/process
   * Fetch transcripts + detect moments (declarations, prayers, testimonies).
   * ?limit=N  — how many unprocessed videos to scan (default 50)
   * Runs asynchronously — returns immediately with a 202 acknowledgement.
   */
  @Post('moments/process')
  processMoments(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 50;
    // Fire-and-forget — transcript fetching is slow per video
    this.momentsDetection.processAll(n).then((r) =>
      console.log(`[MomentsDetection] done: ${JSON.stringify(r)}`),
    );
    return { message: `Processing up to ${n} videos in background.` };
  }
}
