import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getNotificationPreferences(userId: number): Promise<{ notificationsEnabled: boolean }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { notificationsEnabled: true },
    });
    return { notificationsEnabled: user?.notificationsEnabled ?? true };
  }

  async updateNotificationPreferences(
    userId: number,
    enabled: boolean,
  ): Promise<{ notificationsEnabled: boolean }> {
    await this.userRepo.update(userId, { notificationsEnabled: enabled });
    return { notificationsEnabled: enabled };
  }
}
