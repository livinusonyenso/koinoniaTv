import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index,
} from 'typeorm';
import { VideoCategory } from './video-category.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'icon_name', length: 50, nullable: true })
  iconName: string;

  @Column({ name: 'color_hex', length: 7, nullable: true })
  colorHex: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => VideoCategory, (vc) => vc.category)
  videoCategories: VideoCategory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
