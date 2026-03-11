import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Video } from '../videos/video.entity';
import { Category } from './category.entity';

export enum TaggedBy {
  MANUAL  = 'manual',
  KEYWORD = 'keyword',
  AI      = 'ai',
}

@Entity('video_categories')
export class VideoCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Video, (v) => v.videoCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'video_id' })
  video: Video;

  @Column({ name: 'video_id' })
  videoId: number;

  @ManyToOne(() => Category, (c) => c.videoCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: number;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  confidenceScore: number;

  @Column({ name: 'tagged_by', type: 'enum', enum: TaggedBy, default: TaggedBy.KEYWORD })
  taggedBy: TaggedBy;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
