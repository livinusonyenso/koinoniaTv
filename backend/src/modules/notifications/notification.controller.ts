import {
  Controller, Post, Body, UseGuards, Req,
  ForbiddenException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationService } from './notification.service';

class RegisterTokenDto {
  @IsString() @IsNotEmpty()
  token: string;

  @IsString() @IsOptional()
  platform?: string;
}

class BroadcastDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsString() @IsNotEmpty()
  body: string;
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notif: NotificationService) {}

  /** POST /notifications/device-token — register FCM token (JWT required) */
  @Post('device-token')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  registerToken(@Req() req: any, @Body() dto: RegisterTokenDto) {
    return this.notif.registerToken(req.user.id, dto.token, dto.platform ?? 'android');
  }

  /** POST /notifications/broadcast — admin only */
  @Post('broadcast')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  broadcast(@Req() req: any, @Body() dto: BroadcastDto) {
    if (!req.user?.isAdmin) throw new ForbiddenException('Admins only');
    this.notif.sendToAll(dto.title, dto.body).catch(() => {});
  }
}
