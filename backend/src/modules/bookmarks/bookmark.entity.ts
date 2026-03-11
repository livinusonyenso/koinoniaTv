import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Video } from '../videos/video.entity';

@Entity('bookmarks')
@Unique(['userId', 'videoId'])
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => Video, (v) => v.bookmarks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 'video_id' })
  videoId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
