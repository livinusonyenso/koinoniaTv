import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from './device-token.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { initFirebase } from './firebase.config';

initFirebase(); // initialise once when the module is loaded

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService], // so YoutubeSyncService can inject it
})
export class NotificationModule {}
