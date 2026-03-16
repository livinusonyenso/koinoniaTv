import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrayerRequest } from './prayer-request.entity';
import { PrayerRequestsService } from './prayer-requests.service';
import { PrayerRequestsController } from './prayer-requests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PrayerRequest])],
  controllers: [PrayerRequestsController],
  providers: [PrayerRequestsService],
  exports: [PrayerRequestsService],
})
export class PrayerRequestsModule {}
