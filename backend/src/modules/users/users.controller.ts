import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { WatchHistoryService } from '../watch-history/watch-history.service';

@Controller('users')
export class UsersController {
  constructor(
    private bookmarks: BookmarksService,
    private history: WatchHistoryService,
  ) {}

  @Get('bookmarks')
  @UseGuards(AuthGuard('jwt'))
  getBookmarks(@Req() req: any, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.bookmarks.findAll(req.user.id, +p, +l);
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  getHistory(@Req() req: any, @Query('page') p = 1, @Query('limit') l = 20) {
    return this.history.findAll(req.user.id, +p, +l);
  }
}
