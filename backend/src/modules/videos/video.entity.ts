import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany, OneToMany, Index,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { VideoCategory } from '../categories/video-category.entity';
import { Clip } from '../clips/clip.entity';
import { WatchHistory } from '../watch-history/watch-history.entity';
import { Bookmark } from '../bookmarks/bookmark.entity';

export enum SyncStatus {
  SYNCED  = 'synced',
  PENDING = 'pending',
  ERROR   = 'error',
}

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'youtube_id', length: 20 })
  youtubeId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ name: 'thumbnail_url', length: 500 })
  thumbnailUrl: string;

  @Column({ name: 'duration_seconds', default: 0 })
  durationSeconds: number;

  @Column({ name: 'published_at', type: 'datetime' })
  publishedAt: Date;

  @Column({ name: 'view_count', type: 'bigint', default: 0 })
  viewCount: number;

  @Column({ name: 'like_count', type: 'bigint', default: 0 })
  likeCount: number;

  @Column({ name: 'is_live', default: false })
  isLive: boolean;

  @Column({ name: 'is_upcoming', default: false })
  isUpcoming: boolean;

  @Column({ name: 'scheduled_start', type: 'datetime', nullable: true })
  scheduledStart: Date;

  @Column({ name: 'sync_status', type: 'enum', enum: SyncStatus, default: SyncStatus.SYNCED })
  syncStatus: SyncStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @OneToMany(() => VideoCategory, (vc) => vc.video, { cascade: true })
  videoCategories: VideoCategory[];

  @OneToMany(() => Clip, (c) => c.video)
  clips: Clip[];

  @OneToMany(() => WatchHistory, (wh) => wh.video)
  watchHistories: WatchHistory[];

  @OneToMany(() => Bookmark, (b) => b.video)
  bookmarks: Bookmark[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
