import {
  Controller, Get, Post, Delete, Param, Query,
  UseGuards, Req, ParseIntPipe, Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideosService } from './videos.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { WatchHistoryService } from '../watch-history/watch-history.service';

@Controller('videos')
export class VideosController {
  constructor(
    private videos: VideosService,
    private bookmarks: BookmarksService,
    private history: WatchHistoryService,
  ) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('category') category?: string,
    @Query('year') year?: number,
    @Query('sort') sort: 'latest' | 'trending' | 'az' = 'latest',
  ) {
    return this.videos.findAll({ page: +page, limit: +limit, category, year: year ? +year : undefined, sort });
  }

  @Get('featured')
  findFeatured() { return this.videos.findFeatured(); }

  @Get('latest')
  findLatest(@Query('limit') limit = 10) { return this.videos.findLatest(+limit); }

  @Get('trending')
  findTrending(@Query('limit') limit = 10) { return this.videos.findTrending(+limit); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.videos.findOne(id); }

  @Get(':id/related')
  findRelated(@Param('id', ParseIntPipe) id: number) { return this.videos.findRelated(id); }

  @Post(':id/bookmark')
  @UseGuards(AuthGuard('jwt'))
  addBookmark(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.bookmarks.add(req.user.id, id);
  }

  @Delete(':id/bookmark')
  @UseGuards(AuthGuard('jwt'))
  removeBookmark(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.bookmarks.remove(req.user.id, id);
  }

  @Post(':id/progress')
  @UseGuards(AuthGuard('jwt'))
  saveProgress(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('progressSeconds') progressSeconds: number,
  ) {
    return this.history.saveProgress(req.user.id, id, progressSeconds);
  }

  @Get(':id/progress')
  @UseGuards(AuthGuard('jwt'))
  getProgress(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.history.getProgress(req.user.id, id);
  }
}
