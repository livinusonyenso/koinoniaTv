import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum PrayerCategory {
  HEALING     = 'healing',
  FINANCIAL   = 'financial',
  FAMILY      = 'family',
  CAREER      = 'career',
  MARRIAGE    = 'marriage',
  SALVATION   = 'salvation',
  OTHER       = 'other',
}

@Entity('prayer_requests')
export class PrayerRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'enum', enum: PrayerCategory })
  category: PrayerCategory;

  @Column('text')
  request: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
