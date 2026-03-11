import { Controller, Get, Query } from '@nestjs/common';
import { VideosService } from '../videos/videos.service';

@Controller('search')
export class SearchController {
  constructor(private videos: VideosService) {}

  @Get()
  search(@Query('q') q: string, @Query('page') p = 1, @Query('limit') l = 20) {
    if (!q) return { items: [], total: 0 };
    return this.videos.search(q, +p, +l);
  }

  @Get('suggestions')
  async suggestions(@Query('q') q: string) {
    if (!q || q.length < 2) return { suggestions: [] };
    const result = await this.videos.search(q, 1, 5);
    return { suggestions: result.items.map((v) => v.title) };
  }
}
