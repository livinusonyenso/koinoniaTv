import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Video } from '../videos/video.entity';

export enum ClipType {
  QUOTE       = 'quote',
  DECLARATION = 'declaration',
  HIGHLIGHT   = 'highlight',
}

@Entity('clips')
export class Clip {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Video, (v) => v.clips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 'video_id' })
  videoId: number;

  @Column({ length: 300 })
  title: string;

  @Column({ name: 'youtube_id', length: 20, nullable: true })
  youtubeId: string;

  @Column({ name: 'start_seconds' })
  startSeconds: number;

  @Column({ name: 'end_seconds' })
  endSeconds: number;

  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ name: 'clip_type', type: 'enum', enum: ClipType, default: ClipType.HIGHLIGHT })
  clipType: ClipType;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'share_count', default: 0 })
  shareCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get durationSeconds(): number {
    return this.endSeconds - this.startSeconds;
  }
}
