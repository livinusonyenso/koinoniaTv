import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('device_tokens')
@Index(['userId', 'token'], { unique: true })
export class DeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 500 })
  token: string;

  /** 'android' | 'ios' */
  @Column({ length: 20, default: 'android' })
  platform: string;

  @CreateDateColumn()
  createdAt: Date;
}
