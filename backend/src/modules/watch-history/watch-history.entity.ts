import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Video } from '../videos/video.entity';

@Entity('watch_history')
export class WatchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.watchHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Video, (v) => v.watchHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 'video_id' })
  videoId: number;

  @Column({ name: 'progress_seconds', default: 0 })
  progressSeconds: number;

  @Column({ name: 'completed', default: false })
  completed: boolean;

  @UpdateDateColumn({ name: 'watched_at' })
  watchedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
