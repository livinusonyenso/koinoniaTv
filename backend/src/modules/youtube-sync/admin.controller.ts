import {
  Controller, Post, Get, Delete, Body, Query, Param,
  ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { unlinkSync, existsSync, mkdirSync } from 'fs';
import { YoutubeSyncService } from './youtube-sync.service';
import { CategorizationService } from './categorization.service';
import { MomentsDetectionService } from '../moments/moments-detection.service';
import { VideosService } from '../videos/videos.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncLog } from './sync-log.entity';

@Controller('admin')
export class AdminController {
  constructor(
    private sync: YoutubeSyncService,
    private categorization: CategorizationService,
    private momentsDetection: MomentsDetectionService,
    private videos: VideosService,
    @InjectRepository(SyncLog) private logRepo: Repository<SyncLog>,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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

  // ─── Audio upload ─────────────────────────────────────────────────────────────

  /**
   * POST /admin/videos/:id/audio
   * Upload an MP3 file for a video (multipart/form-data, field name = "audio").
   * Returns the updated video with its new audioUrl.
   */
  @Post('videos/:id/audio')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'audio');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const id = req.params.id;
          const ext = extname(file.originalname).toLowerCase() || '.mp3';
          cb(null, `video-${id}-${Date.now()}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['.mp3', '.m4a', '.aac', '.wav', '.ogg'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowed.includes(ext) || file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only audio files are allowed'), false);
        }
      },
      limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
    }),
  )
  async uploadAudio(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No audio file provided');

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const audioUrl = `${appUrl}/uploads/audio/${file.filename}`;
    return this.videos.setAudioUrl(id, audioUrl);
  }

  /**
   * DELETE /admin/videos/:id/audio
   * Remove the audio file reference (and the physical file) from a video.
   */
  @Delete('videos/:id/audio')
  async removeAudio(@Param('id', ParseIntPipe) id: number) {
    const video = await this.videos.findOne(id);
    if (video.audioUrl) {
      // Remove physical file if it lives in our uploads folder
      const filename = video.audioUrl.split('/uploads/audio/').pop();
      if (filename) {
        const filePath = join(process.cwd(), 'uploads', 'audio', filename);
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    }
    await this.videos.removeAudioUrl(id);
    return { message: 'Audio removed' };
  }
}
