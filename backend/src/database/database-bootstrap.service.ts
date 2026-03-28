import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * DatabaseBootstrapService
 *
 * Runs once after the NestJS application has fully initialised (OnApplicationBootstrap).
 * Responsibilities:
 *  1. Audits every expected table — reports present / missing
 *  2. Audits critical columns per table — adds any that are missing (safety net
 *     in case migrations were skipped or ran out of order)
 *  3. Audits key indexes and creates any that are absent
 *  4. Seeds reference data (categories) idempotently
 *  5. Emits a structured startup report to the console
 *
 * This service does NOT replace migrations; it is a belt-and-suspenders guard
 * that keeps the production database self-healing at every restart.
 */
@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // ─── Lifecycle hook ─────────────────────────────────────────────────────────

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('━━━━━━━━━━━━━━  DATABASE BOOTSTRAP  ━━━━━━━━━━━━━━');
    try {
      await this.auditTables();
      await this.auditColumns();
      await this.auditIndexes();
      await this.seedCategories();
    } catch (err) {
      this.logger.error('Bootstrap encountered an error — app will continue', err);
    }
    this.logger.log('━━━━━━━━━━━━━━  BOOTSTRAP COMPLETE  ━━━━━━━━━━━━━━');
  }

  // ─── Table audit ────────────────────────────────────────────────────────────

  private readonly EXPECTED_TABLES = [
    'users', 'videos', 'categories', 'video_categories',
    'clips', 'events', 'watch_history', 'bookmarks',
    'sync_logs', 'moments', 'prayer_requests', 'device_tokens',
  ];

  private async auditTables(): Promise<void> {
    const present: string[] = [];
    const missing: string[] = [];

    for (const table of this.EXPECTED_TABLES) {
      const exists = await this.tableExists(table);
      (exists ? present : missing).push(table);
    }

    this.logger.log(`Tables present (${present.length}): ${present.join(', ')}`);

    if (missing.length) {
      this.logger.error(
        `Tables MISSING (${missing.length}): ${missing.join(', ')} — run pending migrations!`,
      );
    } else {
      this.logger.log('All expected tables are present ✅');
    }
  }

  // ─── Column audit ───────────────────────────────────────────────────────────
  // Maps each critical column to its ALTER TABLE definition.
  // Only columns that are safe to add with a default are listed here.

  private readonly CRITICAL_COLUMNS: Array<{
    table: string;
    column: string;
    definition: string;
  }> = [
    // users
    { table: 'users', column: 'notifications_enabled', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
    { table: 'users', column: 'is_admin',              definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { table: 'users', column: 'fcm_token',             definition: 'VARCHAR(500) NULL' },
    // videos
    { table: 'videos', column: 'is_featured',          definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { table: 'videos', column: 'is_upcoming',          definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { table: 'videos', column: 'like_count',           definition: 'BIGINT NOT NULL DEFAULT 0' },
    // categories
    { table: 'categories', column: 'sort_order',       definition: 'INT NOT NULL DEFAULT 0' },
    { table: 'categories', column: 'icon_name',        definition: 'VARCHAR(50) NULL' },
    { table: 'categories', column: 'color_hex',        definition: 'VARCHAR(7) NULL' },
    // events
    { table: 'events', column: 'is_online',            definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { table: 'events', column: 'registration_url',     definition: 'VARCHAR(500) NULL' },
    { table: 'events', column: 'banner_url',           definition: 'VARCHAR(500) NULL' },
    { table: 'events', column: 'live_stream_url',      definition: 'VARCHAR(500) NULL' },
    // clips
    { table: 'clips', column: 'is_featured',           definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
    { table: 'clips', column: 'share_count',           definition: 'INT NOT NULL DEFAULT 0' },
  ];

  private async auditColumns(): Promise<void> {
    const added:   string[] = [];
    const present: string[] = [];
    const skipped: string[] = []; // table doesn't exist

    for (const { table, column, definition } of this.CRITICAL_COLUMNS) {
      if (!(await this.tableExists(table))) {
        skipped.push(`${table}.${column}`);
        continue;
      }

      const exists = await this.columnExists(table, column);
      if (!exists) {
        try {
          await this.dataSource.query(
            `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`,
          );
          this.logger.warn(`Added missing column: ${table}.${column}`);
          added.push(`${table}.${column}`);
        } catch (err: any) {
          this.logger.error(`Failed to add ${table}.${column}: ${err.message}`);
        }
      } else {
        present.push(`${table}.${column}`);
      }
    }

    if (added.length)   this.logger.warn(`Columns auto-added (${added.length}):  ${added.join(', ')}`);
    if (skipped.length) this.logger.warn(`Columns skipped — table missing (${skipped.length}): ${skipped.join(', ')}`);
    this.logger.log(`Columns present (${present.length}) — all critical columns verified`);
  }

  // ─── Index audit ────────────────────────────────────────────────────────────

  private readonly CRITICAL_INDEXES: Array<{
    table: string;
    name: string;
    columns: string[];
    unique?: boolean;
  }> = [
    { table: 'videos',           name: 'idx_videos_published_at',       columns: ['published_at'] },
    { table: 'videos',           name: 'idx_videos_view_count',          columns: ['view_count'] },
    { table: 'video_categories', name: 'idx_video_categories_composite', columns: ['video_id', 'category_id'], unique: true },
    { table: 'events',           name: 'idx_events_start_datetime',      columns: ['start_datetime'] },
    { table: 'moments',          name: 'idx_moments_youtube_id',         columns: ['youtube_id'] },
  ];

  private async auditIndexes(): Promise<void> {
    const added:   string[] = [];
    const present: string[] = [];

    for (const { table, name, columns, unique } of this.CRITICAL_INDEXES) {
      if (!(await this.tableExists(table))) continue;

      const exists = await this.indexExists(table, name);
      if (!exists) {
        try {
          const cols = columns.map((c) => `\`${c}\``).join(', ');
          const kind = unique ? 'UNIQUE INDEX' : 'INDEX';
          await this.dataSource.query(
            `CREATE ${kind} \`${name}\` ON \`${table}\` (${cols})`,
          );
          this.logger.warn(`Added missing index: ${table} → ${name}`);
          added.push(name);
        } catch (err: any) {
          this.logger.error(`Failed to add index ${name}: ${err.message}`);
        }
      } else {
        present.push(name);
      }
    }

    if (added.length) this.logger.warn(`Indexes auto-added (${added.length}): ${added.join(', ')}`);
    this.logger.log(`Indexes present (${present.length}) — all critical indexes verified`);
  }

  // ─── Category seeding ───────────────────────────────────────────────────────

  private readonly CATEGORIES = [
    { name: 'Faith',           slug: 'faith',           iconName: 'heart',             colorHex: '#E53935', sortOrder: 1 },
    { name: 'Favor',           slug: 'favor',           iconName: 'star',              colorHex: '#FFB300', sortOrder: 2 },
    { name: 'Prayer',          slug: 'prayer',          iconName: 'hands-pray',        colorHex: '#1565C0', sortOrder: 3 },
    { name: 'Spiritual Growth',slug: 'spiritual-growth',iconName: 'seedling',          colorHex: '#2E7D32', sortOrder: 4 },
    { name: 'Wisdom',          slug: 'wisdom',          iconName: 'lightbulb',         colorHex: '#6A1B9A', sortOrder: 5 },
    { name: 'Relationships',   slug: 'relationships',   iconName: 'users',             colorHex: '#00838F', sortOrder: 6 },
    { name: 'Purpose',         slug: 'purpose',         iconName: 'compass',           colorHex: '#E65100', sortOrder: 7 },
    { name: 'Deliverance',     slug: 'deliverance',     iconName: 'shield',            colorHex: '#37474F', sortOrder: 8 },
    { name: 'Miracle Service', slug: 'miracle-service', iconName: 'lightning-bolt',    colorHex: '#FF6F00', sortOrder: 9 },
    { name: 'School of Ministry', slug: 'school-of-ministry', iconName: 'school',     colorHex: '#1A237E', sortOrder: 10 },
    { name: 'Songs',           slug: 'songs',           iconName: 'music-note-whole',  colorHex: '#AD1457', sortOrder: 11 },
    { name: 'Declarations',    slug: 'declarations',    iconName: 'bullhorn',          colorHex: '#00695C', sortOrder: 12 },
  ];

  private async seedCategories(): Promise<void> {
    if (!(await this.tableExists('categories'))) {
      this.logger.warn('categories table missing — seed skipped');
      return;
    }

    let inserted = 0;
    let skipped  = 0;

    for (const cat of this.CATEGORIES) {
      const rows: any[] = await this.dataSource.query(
        'SELECT id FROM categories WHERE slug = ? LIMIT 1',
        [cat.slug],
      );

      if (rows.length === 0) {
        await this.dataSource.query(
          `INSERT INTO categories (name, slug, icon_name, color_hex, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [cat.name, cat.slug, cat.iconName, cat.colorHex, cat.sortOrder],
        );
        this.logger.log(`  Seeded category: ${cat.name}`);
        inserted++;
      } else {
        skipped++;
      }
    }

    this.logger.log(
      `Categories — inserted: ${inserted}, already present: ${skipped}`,
    );
  }

  // ─── Low-level helpers ──────────────────────────────────────────────────────

  private async tableExists(table: string): Promise<boolean> {
    const rows: any[] = await this.dataSource.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
      [table],
    );
    return rows.length > 0;
  }

  private async columnExists(table: string, column: string): Promise<boolean> {
    const rows: any[] = await this.dataSource.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
      [table, column],
    );
    return rows.length > 0;
  }

  private async indexExists(table: string, indexName: string): Promise<boolean> {
    const rows: any[] = await this.dataSource.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
      [table, indexName],
    );
    return rows.length > 0;
  }
}
