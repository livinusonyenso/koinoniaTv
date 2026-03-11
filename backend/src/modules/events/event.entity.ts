import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum EventType {
  SERVICE    = 'service',
  CONFERENCE = 'conference',
  EXTERNAL   = 'external',
  SPECIAL    = 'special',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'event_type', type: 'enum', enum: EventType, default: EventType.SERVICE })
  eventType: EventType;

  @Column({ name: 'start_datetime', type: 'datetime' })
  startDatetime: Date;

  @Column({ name: 'end_datetime', type: 'datetime', nullable: true })
  endDatetime: Date;

  @Column({ name: 'location_name', length: 300, nullable: true })
  locationName: string;

  @Column({ name: 'location_address', type: 'text', nullable: true })
  locationAddress: string;

  @Column({ name: 'location_city', length: 100, nullable: true })
  locationCity: string;

  @Column({ name: 'location_country', length: 100, nullable: true })
  locationCountry: string;

  @Column({ name: 'banner_url', length: 500, nullable: true })
  bannerUrl: string;

  @Column({ name: 'live_stream_url', length: 500, nullable: true })
  liveStreamUrl: string;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ name: 'registration_url', length: 500, nullable: true })
  registrationUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
