import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { configValidationSchema } from './config/config.schema';

import { Video } from './modules/videos/video.entity';
import { Category } from './modules/categories/category.entity';
import { VideoCategory } from './modules/categories/video-category.entity';
import { Clip } from './modules/clips/clip.entity';
import { Event } from './modules/events/event.entity';
import { User } from './modules/users/user.entity';
import { WatchHistory } from './modules/watch-history/watch-history.entity';
import { Bookmark } from './modules/bookmarks/bookmark.entity';
import { SyncLog } from './modules/youtube-sync/sync-log.entity';

import { AuthService } from './modules/auth/auth.service';
import { JwtStrategy } from './modules/auth/jwt.strategy';
import { VideosService } from './modules/videos/videos.service';
import { CategoriesService } from './modules/categories/categories.service';
import { ClipsService } from './modules/clips/clips.service';
import { EventsService } from './modules/events/events.service';
import { LiveService } from './modules/live/live.service';
import { BookmarksService } from './modules/bookmarks/bookmarks.service';
import { WatchHistoryService } from './modules/watch-history/watch-history.service';
import { YoutubeSyncService } from './modules/youtube-sync/youtube-sync.service';
import { YoutubeApiService } from './modules/youtube-sync/youtube-api.service';
import { CategorizationService } from './modules/youtube-sync/categorization.service';

import { AuthController } from './modules/auth/auth.controller';
import { VideosController } from './modules/videos/videos.controller';
import { CategoriesController } from './modules/categories/categories.controller';
import { ClipsController } from './modules/clips/clips.controller';
import { EventsController } from './modules/events/events.controller';
import { LiveController } from './modules/live/live.controller';
import { SearchController } from './modules/search/search.controller';
import { UsersController } from './modules/users/users.controller';
import { AdminController } from './modules/youtube-sync/admin.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: configValidationSchema }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        secret: c.get('JWT_SECRET'),
        signOptions: { expiresIn: c.get('JWT_EXPIRES_IN') },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        type: 'mysql',
        driver: require('mysql2'),
        host: c.get('DB_HOST'),
        port: +c.get('DB_PORT'),
        database: c.get('DB_NAME'),
        username: c.get('DB_USER'),
        password: c.get('DB_PASSWORD'),
        entities: [Video, Category, VideoCategory, Clip, Event, User, WatchHistory, Bookmark, SyncLog],
        synchronize: c.get('NODE_ENV') !== 'production',
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([
      Video, Category, VideoCategory, Clip, Event,
      User, WatchHistory, Bookmark, SyncLog,
    ]),
  ],
  controllers: [
    AuthController, VideosController, CategoriesController,
    ClipsController, EventsController, LiveController,
    SearchController, UsersController, AdminController,
  ],
  providers: [
    AuthService, JwtStrategy,
    VideosService, CategoriesService, ClipsService,
    EventsService, LiveService,
    BookmarksService, WatchHistoryService,
    YoutubeSyncService, YoutubeApiService, CategorizationService,
  ],
})
export class AppModule {}
