import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { configValidationSchema } from './config/config.schema';
import { AppCacheModule } from './modules/cache/app-cache.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

import { Video } from './modules/videos/video.entity';
import { Category } from './modules/categories/category.entity';
import { VideoCategory } from './modules/categories/video-category.entity';
import { Clip } from './modules/clips/clip.entity';
import { Event } from './modules/events/event.entity';
import { User } from './modules/users/user.entity';
import { WatchHistory } from './modules/watch-history/watch-history.entity';
import { Bookmark } from './modules/bookmarks/bookmark.entity';
import { SyncLog } from './modules/youtube-sync/sync-log.entity';
import { Moment } from './modules/moments/moment.entity';
import { PrayerRequest } from './modules/prayer-requests/prayer-request.entity';
import { PrayerRequestsModule } from './modules/prayer-requests/prayer-requests.module';
import { DeviceToken } from './modules/notifications/device-token.entity';
import { NotificationModule } from './modules/notifications/notification.module';

import { AuthService } from './modules/auth/auth.service';
import { JwtStrategy } from './modules/auth/jwt.strategy';
import { VideosService } from './modules/videos/videos.service';
import { CategoriesService } from './modules/categories/categories.service';
import { ClipsService } from './modules/clips/clips.service';
import { EventsService } from './modules/events/events.service';
import { LiveService } from './modules/live/live.service';
import { BookmarksService } from './modules/bookmarks/bookmarks.service';
import { WatchHistoryService } from './modules/watch-history/watch-history.service';
import { UsersService } from './modules/users/users.service';
import { YoutubeSyncService } from './modules/youtube-sync/youtube-sync.service';
import { YoutubeApiService } from './modules/youtube-sync/youtube-api.service';
import { CategorizationService } from './modules/youtube-sync/categorization.service';
import { TranscriptService } from './modules/youtube-sync/transcript.service';
import { MomentsDetectionService } from './modules/moments/moments-detection.service';
import { MomentsService } from './modules/moments/moments.service';
import { MomentsController } from './modules/moments/moments.controller';
import { DatabaseBootstrapService } from './database/database-bootstrap.service';

import { AuthController } from './modules/auth/auth.controller';
import { VideosController } from './modules/videos/videos.controller';
import { CategoriesController } from './modules/categories/categories.controller';
import { ClipsController } from './modules/clips/clips.controller';
import { EventsController } from './modules/events/events.controller';
import { LiveController } from './modules/live/live.controller';
import { SearchController } from './modules/search/search.controller';
import { UsersController } from './modules/users/users.controller';
import { AdminController } from './modules/youtube-sync/admin.controller';

const ENTITIES = [
  Video, Category, VideoCategory, Clip, Event,
  User, WatchHistory, Bookmark, SyncLog, Moment,
  PrayerRequest, DeviceToken,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: configValidationSchema }),
    ScheduleModule.forRoot(),

    // Rate limiting — 100 req / min per IP globally
    ThrottlerModule.forRoot([{ name: 'global', ttl: 60_000, limit: 100 }]),

    // Redis cache (falls back to in-memory if Redis unavailable)
    AppCacheModule,

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
        connectorPackage: 'mysql2',
        host: c.get('DB_HOST'),
        port: +c.get('DB_PORT'),
        database: c.get('DB_NAME'),
        username: c.get('DB_USER'),
        password: c.get('DB_PASSWORD'),
        entities: ENTITIES,
        // synchronize is OFF — schema changes go through migrations
        synchronize: false,
        migrationsRun: true,
        migrations: ['dist/database/migrations/*.js'],
        logging: c.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
    }),
    TypeOrmModule.forFeature([
      Video, Category, VideoCategory, Clip, Event,
      User, WatchHistory, Bookmark, SyncLog, Moment,
    ]),
    PrayerRequestsModule,
    NotificationModule,
  ],
  controllers: [
    AuthController, VideosController, CategoriesController,
    ClipsController, EventsController, LiveController,
    SearchController, UsersController, AdminController,
    MomentsController,
  ],
  providers: [
    // Apply rate-limiting guard to every route
    { provide: APP_GUARD,  useClass: ThrottlerGuard },
    // Return clean 429 JSON instead of the default NestJS error shape
    { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },

    AuthService, JwtStrategy,
    VideosService, CategoriesService, ClipsService,
    EventsService, LiveService,
    BookmarksService, WatchHistoryService, UsersService,
    YoutubeSyncService, YoutubeApiService, CategorizationService,
    TranscriptService, MomentsDetectionService, MomentsService,
    // NotificationService is provided by NotificationModule (imported above)
    DatabaseBootstrapService,
  ],
})
export class AppModule {}
