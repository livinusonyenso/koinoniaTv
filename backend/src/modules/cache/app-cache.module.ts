import { Global, Logger, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

const logger = new Logger('AppCacheModule');

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');

        if (redisUrl) {
          try {
            // Dynamically import so the app still starts if the package is missing
            const { redisStore } = await import('cache-manager-redis-yet');
            const store = await redisStore({ url: redisUrl });
            logger.log(`Redis cache connected: ${redisUrl}`);
            return { store };
          } catch (err) {
            logger.warn(
              `Redis unavailable (${(err as Error).message}) — falling back to in-memory cache`,
            );
          }
        } else {
          logger.warn('REDIS_URL not set — using in-memory cache');
        }

        // In-memory fallback — cache-manager default when no store is provided
        return { ttl: 300_000 };
      },
      isGlobal: true,
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
