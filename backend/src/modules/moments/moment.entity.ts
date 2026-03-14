import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { Video } from '../videos/video.entity';

export enum MomentType {
  DECLARATION = 'declaration',
  PRAYER      = 'prayer',
  TESTIMONY   = 'testimony',
}

@Entity('moments')
@Index(['videoId', 'type'])
@Index(['type', 'createdAt'])
export class Moment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: MomentType })
  type: MomentType;

  @Column({ length: 300 })
  title: string;

  @Index()
  @Column({ name: 'youtube_id', length: 20 })
  youtubeId: string;

  @Column({ name: 'video_id', nullable: true })
  videoId: number;

  @ManyToOne(() => Video, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  /** Start time in seconds */
  @Column({ name: 'start_time', type: 'int' })
  startTime: number;

  /** End time in seconds */
  @Column({ name: 'end_time', type: 'int' })
  endTime: number;

  /** Thumbnail URL (inherited from parent video) */
  @Column({ name: 'thumbnail_url', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ name: 'sermon_title', length: 500, nullable: true })
  sermonTitle: string;

  /** The matched transcript line(s) */
  @Column({ name: 'transcript_text', type: 'text', nullable: true })
  transcriptText: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
