import { Body, Controller, Get, Patch, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { WatchHistoryService } from '../watch-history/watch-history.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private bookmarks: BookmarksService,
    private history: WatchHistoryService,
    private usersService: UsersService,
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

  @Get('me/notification-preferences')
  @UseGuards(AuthGuard('jwt'))
  getNotificationPreferences(@Req() req: any) {
    return this.usersService.getNotificationPreferences(req.user.id);
  }

  @Patch('me/notification-preferences')
  @UseGuards(AuthGuard('jwt'))
  updateNotificationPreferences(
    @Req() req: any,
    @Body() body: { notificationsEnabled: boolean },
  ) {
    return this.usersService.updateNotificationPreferences(req.user.id, body.notificationsEnabled);
  }
}
