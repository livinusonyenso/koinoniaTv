import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum SyncType {
  FULL        = 'full',
  INCREMENTAL = 'incremental',
  LIVE_CHECK  = 'live_check',
  UPCOMING    = 'upcoming',
  STATS       = 'stats',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sync_type', type: 'enum', enum: SyncType })
  syncType: SyncType;

  @Column({ name: 'videos_added', default: 0 })
  videosAdded: number;

  @Column({ name: 'videos_updated', default: 0 })
  videosUpdated: number;

  @Column({ type: 'text', nullable: true })
  errors: string | null;

  @Column({ name: 'duration_ms', nullable: true })
  durationMs: number;

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date;
}
