import {
  Body, Controller, ForbiddenException, Get,
  HttpCode, HttpStatus, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { PrayerRequestsService } from './prayer-requests.service';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';

@Controller('prayer-requests')
export class PrayerRequestsController {
  constructor(private readonly service: PrayerRequestsService) {}

  /**
   * POST /prayer-requests
   * Public — no JWT required.
   * Rate-limited: 5 submissions per minute per IP.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  submit(@Body() dto: CreatePrayerRequestDto, @Req() req: any) {
    const userId: string | undefined = req.user?.id;
    return this.service.create(dto, userId);
  }

  /**
   * GET /prayer-requests?page=1&limit=20
   * JWT + admin required.
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  list(
    @Req() req: any,
    @Query('page')  page  = 1,
    @Query('limit') limit = 20,
  ) {
    if (!req.user?.isAdmin) throw new ForbiddenException('Admins only');
    return this.service.findAll(+page, +limit);
  }
}
