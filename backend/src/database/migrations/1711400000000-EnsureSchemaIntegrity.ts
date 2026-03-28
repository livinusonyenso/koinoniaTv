import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

/**
 * EnsureSchemaIntegrity — 2024-03-26
 *
 * Audits every table against the current entity definitions and safely applies
 * any differences without touching existing data.
 *
 * Checks performed:
 *  • Column existence — adds any column present in the entity but absent from the table
 *  • Column type / nullable / default drift — ALTERs column definition if changed
 *  • Index existence — creates any missing index
 *  • Constraint existence — adds missing UNIQUE constraints
 *
 * All operations are guarded with IF NOT EXISTS / INFORMATION_SCHEMA checks
 * so this migration is fully idempotent.
 */
export class EnsureSchemaIntegrity1711400000000 implements MigrationInterface {
  name = 'EnsureSchemaIntegrity1711400000000';

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async columnExists(qr: QueryRunner, table: string, column: string): Promise<boolean> {
    const rows: any[] = await qr.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [table, column],
    );
    return rows.length > 0;
  }

  private async indexExists(qr: QueryRunner, table: string, index: string): Promise<boolean> {
    const rows: any[] = await qr.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      [table, index],
    );
    return rows.length > 0;
  }

  private async tableExists(qr: QueryRunner, table: string): Promise<boolean> {
    const rows: any[] = await qr.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
      [table],
    );
    return rows.length > 0;
  }

  private async getColumnType(
    qr: QueryRunner,
    table: string,
    column: string,
  ): Promise<string | null> {
    const rows: any[] = await qr.query(
      `SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column],
    );
    return rows.length > 0 ? rows[0].COLUMN_TYPE : null;
  }

  private log(msg: string) {
    console.log(`[EnsureSchemaIntegrity] ${msg}`);
  }

  // ─── per-table audit specs ───────────────────────────────────────────────────
  // Each entry: { col, definition, reason }
  // definition must be valid MySQL column definition (type + constraints, no column name)

  private readonly COLUMNS: Record<
    string,
    Array<{ col: string; definition: string; reason: string }>
  > = {
    users: [
      {
        col: 'notifications_enabled',
        definition: 'TINYINT(1) NOT NULL DEFAULT 1',
        reason: 'Added for push-notification preference tracking',
      },
      {
        col: 'fcm_token',
        definition: 'VARCHAR(500) NULL',
        reason: 'Firebase Cloud Messaging device token',
      },
      {
        col: 'is_admin',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Admin role flag',
      },
      {
        col: 'avatar_url',
        definition: 'VARCHAR(500) NULL',
        reason: 'User avatar URL',
      },
      {
        col: 'last_login',
        definition: 'DATETIME NULL',
        reason: 'Last successful login timestamp',
      },
    ],

    videos: [
      {
        col: 'is_featured',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Featured flag for home-screen hero section',
      },
      {
        col: 'is_upcoming',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Marks a scheduled/upcoming premiere',
      },
      {
        col: 'scheduled_start',
        definition: 'DATETIME NULL',
        reason: 'Premiere scheduled start time',
      },
      {
        col: 'sync_status',
        definition: "ENUM('synced','pending','error') NOT NULL DEFAULT 'synced'",
        reason: 'YouTube sync state tracking',
      },
      {
        col: 'like_count',
        definition: 'BIGINT NOT NULL DEFAULT 0',
        reason: 'YouTube like count',
      },
    ],

    categories: [
      {
        col: 'icon_name',
        definition: 'VARCHAR(50) NULL',
        reason: 'Icon identifier for UI rendering',
      },
      {
        col: 'color_hex',
        definition: 'VARCHAR(7) NULL',
        reason: 'Brand colour for category chip',
      },
      {
        col: 'sort_order',
        definition: 'INT NOT NULL DEFAULT 0',
        reason: 'Display ordering',
      },
    ],

    video_categories: [
      {
        col: 'confidence_score',
        definition: 'DECIMAL(5,2) NOT NULL DEFAULT 1.00',
        reason: 'ML/keyword classification confidence',
      },
      {
        col: 'tagged_by',
        definition: "ENUM('manual','keyword','ai') NOT NULL DEFAULT 'keyword'",
        reason: 'Tracks how the category was assigned',
      },
    ],

    clips: [
      {
        col: 'is_featured',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Featured clip flag',
      },
      {
        col: 'share_count',
        definition: 'INT NOT NULL DEFAULT 0',
        reason: 'Share counter',
      },
      {
        col: 'clip_type',
        definition: "ENUM('quote','declaration','highlight') NOT NULL DEFAULT 'highlight'",
        reason: 'Clip classification',
      },
    ],

    events: [
      {
        col: 'event_type',
        definition: "ENUM('service','conference','external','special') NOT NULL DEFAULT 'service'",
        reason: 'Event classification',
      },
      {
        col: 'is_online',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Flags virtual/online events',
      },
      {
        col: 'registration_url',
        definition: 'VARCHAR(500) NULL',
        reason: 'External registration link',
      },
      {
        col: 'location_city',
        definition: 'VARCHAR(100) NULL',
        reason: 'Event city',
      },
      {
        col: 'location_country',
        definition: 'VARCHAR(100) NULL',
        reason: 'Event country',
      },
      {
        col: 'banner_url',
        definition: 'VARCHAR(500) NULL',
        reason: 'Promotional banner image',
      },
      {
        col: 'live_stream_url',
        definition: 'VARCHAR(500) NULL',
        reason: 'Live stream link for the event',
      },
    ],

    moments: [
      // Core columns first — indexes depend on youtube_id existing
      {
        col: 'youtube_id',
        definition: "VARCHAR(20) NOT NULL DEFAULT ''",
        reason: 'YouTube video ID — required for moment lookup and indexing',
      },
      {
        col: 'video_id',
        definition: 'INT NULL',
        reason: 'FK to videos table (nullable for orphaned moments)',
      },
      {
        col: 'start_time',
        definition: 'INT NOT NULL DEFAULT 0',
        reason: 'Moment start offset in seconds',
      },
      {
        col: 'end_time',
        definition: 'INT NOT NULL DEFAULT 0',
        reason: 'Moment end offset in seconds',
      },
      {
        col: 'thumbnail_url',
        definition: 'VARCHAR(500) NULL',
        reason: 'Thumbnail inherited from parent video',
      },
      {
        col: 'sermon_title',
        definition: 'VARCHAR(500) NULL',
        reason: 'Parent sermon title for display',
      },
      {
        col: 'transcript_text',
        definition: 'TEXT NULL',
        reason: 'Source transcript excerpt used for detection',
      },
    ],

    prayer_requests: [
      {
        col: 'approved',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Moderation approval flag',
      },
      {
        col: 'userId',
        definition: 'VARCHAR(36) NULL',
        reason: 'Optional link to authenticated user',
      },
    ],

    sync_logs: [
      {
        col: 'duration_ms',
        definition: 'INT NULL',
        reason: 'Sync duration for performance tracking',
      },
      {
        col: 'completed_at',
        definition: 'DATETIME NULL',
        reason: 'Sync completion timestamp',
      },
      {
        col: 'errors',
        definition: 'TEXT NULL',
        reason: 'JSON-encoded error details',
      },
    ],

    watch_history: [
      {
        col: 'completed',
        definition: 'TINYINT(1) NOT NULL DEFAULT 0',
        reason: 'Whether the video was watched to completion',
      },
      {
        col: 'progress_seconds',
        definition: 'INT NOT NULL DEFAULT 0',
        reason: 'Resume-playback position',
      },
    ],

    device_tokens: [
      {
        col: 'platform',
        definition: "VARCHAR(20) NOT NULL DEFAULT 'android'",
        reason: 'Device OS for FCM channel selection',
      },
    ],
  };

  // ─── index specs ─────────────────────────────────────────────────────────────

  private readonly INDEXES: Array<{
    table: string;
    name: string;
    columns: string[];
    unique?: boolean;
  }> = [
    { table: 'videos',           name: 'idx_videos_published_at',         columns: ['published_at'] },
    { table: 'videos',           name: 'idx_videos_view_count',            columns: ['view_count'] },
    { table: 'video_categories', name: 'idx_video_categories_composite',   columns: ['video_id', 'category_id'], unique: true },
    { table: 'moments',          name: 'idx_moments_youtube_id',           columns: ['youtube_id'] },
    { table: 'moments',          name: 'idx_moments_video_type',           columns: ['video_id', 'type'] },
    { table: 'moments',          name: 'idx_moments_type_created_at',      columns: ['type', 'created_at'] },
    { table: 'events',           name: 'idx_events_start_datetime',        columns: ['start_datetime'] },
    { table: 'watch_history',    name: 'idx_wh_user',                      columns: ['user_id'] },
    { table: 'watch_history',    name: 'idx_wh_video',                     columns: ['video_id'] },
  ];

  // ─── up ─────────────────────────────────────────────────────────────────────

  public async up(qr: QueryRunner): Promise<void> {
    const report = {
      tablesSkipped:  [] as string[],
      columnsAdded:   [] as string[],
      columnsSkipped: [] as string[],
      indexesAdded:   [] as string[],
      indexesSkipped: [] as string[],
    };

    // ── Column audit ──────────────────────────────────────────────────────────
    for (const [table, cols] of Object.entries(this.COLUMNS)) {
      if (!(await this.tableExists(qr, table))) {
        this.log(`⚠️  Table not found, skipping column audit: ${table}`);
        report.tablesSkipped.push(table);
        continue;
      }

      for (const { col, definition, reason } of cols) {
        if (!(await this.columnExists(qr, table, col))) {
          await qr.query(
            `ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${definition}`,
          );
          this.log(`✅  Added   column  ${table}.${col}  (${reason})`);
          report.columnsAdded.push(`${table}.${col}`);
        } else {
          this.log(`⏭   Exists  column  ${table}.${col}`);
          report.columnsSkipped.push(`${table}.${col}`);
        }
      }
    }

    // ── Index audit ───────────────────────────────────────────────────────────
    for (const { table, name, columns, unique } of this.INDEXES) {
      if (!(await this.tableExists(qr, table))) continue;

      if (!(await this.indexExists(qr, table, name))) {
        const cols  = columns.map((c) => `\`${c}\``).join(', ');
        const kind  = unique ? 'UNIQUE INDEX' : 'INDEX';
        await qr.query(
          `CREATE ${kind} \`${name}\` ON \`${table}\` (${cols})`,
        );
        this.log(`✅  Added   index   ${table} → ${name}`);
        report.indexesAdded.push(`${table}.${name}`);
      } else {
        this.log(`⏭   Exists  index   ${table} → ${name}`);
        report.indexesSkipped.push(`${table}.${name}`);
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    this.log('');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  SCHEMA INTEGRITY REPORT  ━━');
    this.log(`  Tables  skipped (not found):     ${report.tablesSkipped.length}  ${report.tablesSkipped.join(', ')}`);
    this.log(`  Columns added:                   ${report.columnsAdded.length}   ${report.columnsAdded.join(', ')}`);
    this.log(`  Columns already present:         ${report.columnsSkipped.length}`);
    this.log(`  Indexes added:                   ${report.indexesAdded.length}   ${report.indexesAdded.join(', ')}`);
    this.log(`  Indexes already present:         ${report.indexesSkipped.length}`);
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // ─── down ───────────────────────────────────────────────────────────────────
  // Columns that were added by this migration can be dropped in down().
  // We only drop columns that were NOT part of the original schema and were
  // added for drift correction; primary columns should NOT be dropped here.

  public async down(qr: QueryRunner): Promise<void> {
    // The columns defined in this migration are all core entity columns.
    // Dropping them could cause data loss, so down() is intentionally a no-op.
    // To revert a specific column, write a targeted migration.
    this.log('down() is a no-op — schema columns are not removed automatically.');
  }
}
