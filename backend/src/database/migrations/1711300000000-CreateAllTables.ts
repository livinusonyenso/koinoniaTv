import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CreateAllTables — 2024-03-25
 *
 * Creates every application table that does not yet exist.
 * All DDL statements use IF NOT EXISTS / IF EXISTS guards so this
 * migration is fully idempotent and safe to run on an existing database.
 *
 * Execution order respects FK dependencies:
 *   users → videos → categories → video_categories
 *   videos → clips, watch_history, bookmarks, moments
 *   users  → watch_history, bookmarks
 *   (events, sync_logs, prayer_requests, device_tokens are independent)
 */
export class CreateAllTables1711300000000 implements MigrationInterface {
  name = 'CreateAllTables1711300000000';

  // ─── helpers ────────────────────────────────────────────────────────────────

  private async tableExists(qr: QueryRunner, table: string): Promise<boolean> {
    const rows: any[] = await qr.query(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
      [table],
    );
    return rows.length > 0;
  }

  private log(msg: string) {
    console.log(`[CreateAllTables] ${msg}`);
  }

  // ─── up ─────────────────────────────────────────────────────────────────────

  public async up(qr: QueryRunner): Promise<void> {

    // ── 1. users ──────────────────────────────────────────────────────────────
    if (!(await this.tableExists(qr, 'users'))) {
      await qr.query(`
        CREATE TABLE \`users\` (
          \`id\`                    INT          NOT NULL AUTO_INCREMENT,
          \`email\`                 VARCHAR(255) NOT NULL,
          \`password_hash\`         VARCHAR(255) NULL,
          \`full_name\`             VARCHAR(200) NULL,
          \`avatar_url\`            VARCHAR(500) NULL,
          \`fcm_token\`             VARCHAR(500) NULL,
          \`is_active\`             TINYINT(1)   NOT NULL DEFAULT 1,
          \`is_admin\`              TINYINT(1)   NOT NULL DEFAULT 0,
          \`notifications_enabled\` TINYINT(1)   NOT NULL DEFAULT 1,
          \`last_login\`            DATETIME     NULL,
          \`created_at\`            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\`            DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                                 ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_users_email\` (\`email\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: users');
    } else {
      this.log('⏭   Exists:  users');
    }

    // ── 2. videos ─────────────────────────────────────────────────────────────
    if (!(await this.tableExists(qr, 'videos'))) {
      await qr.query(`
        CREATE TABLE \`videos\` (
          \`id\`               INT          NOT NULL AUTO_INCREMENT,
          \`youtube_id\`       VARCHAR(20)  NOT NULL,
          \`title\`            VARCHAR(500) NOT NULL,
          \`description\`      LONGTEXT     NULL,
          \`thumbnail_url\`    VARCHAR(500) NOT NULL DEFAULT '',
          \`duration_seconds\` INT          NOT NULL DEFAULT 0,
          \`published_at\`     DATETIME     NOT NULL,
          \`view_count\`       BIGINT       NOT NULL DEFAULT 0,
          \`like_count\`       BIGINT       NOT NULL DEFAULT 0,
          \`is_live\`          TINYINT(1)   NOT NULL DEFAULT 0,
          \`is_upcoming\`      TINYINT(1)   NOT NULL DEFAULT 0,
          \`scheduled_start\`  DATETIME     NULL,
          \`sync_status\`      ENUM('synced','pending','error') NOT NULL DEFAULT 'synced',
          \`is_featured\`      TINYINT(1)   NOT NULL DEFAULT 0,
          \`created_at\`       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\`       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                            ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_videos_youtube_id\` (\`youtube_id\`),
          INDEX \`idx_videos_published_at\` (\`published_at\` DESC),
          INDEX \`idx_videos_view_count\`   (\`view_count\`   DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: videos');
    } else {
      this.log('⏭   Exists:  videos');
    }

    // ── 3. categories ─────────────────────────────────────────────────────────
    if (!(await this.tableExists(qr, 'categories'))) {
      await qr.query(`
        CREATE TABLE \`categories\` (
          \`id\`          INT         NOT NULL AUTO_INCREMENT,
          \`name\`        VARCHAR(100) NOT NULL,
          \`slug\`        VARCHAR(100) NOT NULL,
          \`description\` TEXT         NULL,
          \`icon_name\`   VARCHAR(50)  NULL,
          \`color_hex\`   VARCHAR(7)   NULL,
          \`sort_order\`  INT          NOT NULL DEFAULT 0,
          \`created_at\`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_categories_name\` (\`name\`),
          UNIQUE KEY \`UQ_categories_slug\` (\`slug\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: categories');
    } else {
      this.log('⏭   Exists:  categories');
    }

    // ── 4. video_categories (depends on videos + categories) ──────────────────
    if (!(await this.tableExists(qr, 'video_categories'))) {
      await qr.query(`
        CREATE TABLE \`video_categories\` (
          \`id\`               INT            NOT NULL AUTO_INCREMENT,
          \`video_id\`         INT            NOT NULL,
          \`category_id\`      INT            NOT NULL,
          \`confidence_score\` DECIMAL(5,2)   NOT NULL DEFAULT 1.00,
          \`tagged_by\`        ENUM('manual','keyword','ai') NOT NULL DEFAULT 'keyword',
          \`created_at\`       DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`idx_video_categories_composite\` (\`video_id\`, \`category_id\`),
          CONSTRAINT \`FK_vc_video\`    FOREIGN KEY (\`video_id\`)    REFERENCES \`videos\`     (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_vc_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: video_categories');
    } else {
      this.log('⏭   Exists:  video_categories');
    }

    // ── 5. clips (depends on videos) ──────────────────────────────────────────
    if (!(await this.tableExists(qr, 'clips'))) {
      await qr.query(`
        CREATE TABLE \`clips\` (
          \`id\`            INT          NOT NULL AUTO_INCREMENT,
          \`video_id\`      INT          NOT NULL,
          \`title\`         VARCHAR(300) NOT NULL,
          \`youtube_id\`    VARCHAR(20)  NULL,
          \`start_seconds\` INT          NOT NULL,
          \`end_seconds\`   INT          NOT NULL,
          \`thumbnail_url\` VARCHAR(500) NULL,
          \`clip_type\`     ENUM('quote','declaration','highlight') NOT NULL DEFAULT 'highlight',
          \`is_featured\`   TINYINT(1)   NOT NULL DEFAULT 0,
          \`share_count\`   INT          NOT NULL DEFAULT 0,
          \`created_at\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\`    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                         ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`FK_clips_video\` FOREIGN KEY (\`video_id\`) REFERENCES \`videos\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: clips');
    } else {
      this.log('⏭   Exists:  clips');
    }

    // ── 6. events (standalone — was missing in production!) ───────────────────
    if (!(await this.tableExists(qr, 'events'))) {
      await qr.query(`
        CREATE TABLE \`events\` (
          \`id\`                INT          NOT NULL AUTO_INCREMENT,
          \`title\`             VARCHAR(300) NOT NULL,
          \`description\`       TEXT         NULL,
          \`event_type\`        ENUM('service','conference','external','special')
                                             NOT NULL DEFAULT 'service',
          \`start_datetime\`    DATETIME     NOT NULL,
          \`end_datetime\`      DATETIME     NULL,
          \`location_name\`     VARCHAR(300) NULL,
          \`location_address\`  TEXT         NULL,
          \`location_city\`     VARCHAR(100) NULL,
          \`location_country\`  VARCHAR(100) NULL,
          \`banner_url\`        VARCHAR(500) NULL,
          \`live_stream_url\`   VARCHAR(500) NULL,
          \`is_online\`         TINYINT(1)   NOT NULL DEFAULT 0,
          \`registration_url\`  VARCHAR(500) NULL,
          \`created_at\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\`        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                             ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`idx_events_start_datetime\` (\`start_datetime\` ASC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: events');
    } else {
      this.log('⏭   Exists:  events');
    }

    // ── 7. watch_history (depends on users + videos) ──────────────────────────
    if (!(await this.tableExists(qr, 'watch_history'))) {
      await qr.query(`
        CREATE TABLE \`watch_history\` (
          \`id\`               INT         NOT NULL AUTO_INCREMENT,
          \`user_id\`          INT         NOT NULL,
          \`video_id\`         INT         NOT NULL,
          \`progress_seconds\` INT         NOT NULL DEFAULT 0,
          \`completed\`        TINYINT(1)  NOT NULL DEFAULT 0,
          \`watched_at\`       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                           ON UPDATE CURRENT_TIMESTAMP(6),
          \`created_at\`       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`idx_wh_user\`  (\`user_id\`),
          INDEX \`idx_wh_video\` (\`video_id\`),
          CONSTRAINT \`FK_wh_user\`  FOREIGN KEY (\`user_id\`)  REFERENCES \`users\`  (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_wh_video\` FOREIGN KEY (\`video_id\`) REFERENCES \`videos\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: watch_history');
    } else {
      this.log('⏭   Exists:  watch_history');
    }

    // ── 8. bookmarks (depends on users + videos) ──────────────────────────────
    if (!(await this.tableExists(qr, 'bookmarks'))) {
      await qr.query(`
        CREATE TABLE \`bookmarks\` (
          \`id\`         INT         NOT NULL AUTO_INCREMENT,
          \`user_id\`    INT         NOT NULL,
          \`video_id\`   INT         NOT NULL,
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_bookmarks_user_video\` (\`user_id\`, \`video_id\`),
          CONSTRAINT \`FK_bm_user\`  FOREIGN KEY (\`user_id\`)  REFERENCES \`users\`  (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`FK_bm_video\` FOREIGN KEY (\`video_id\`) REFERENCES \`videos\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: bookmarks');
    } else {
      this.log('⏭   Exists:  bookmarks');
    }

    // ── 9. sync_logs (standalone) ─────────────────────────────────────────────
    if (!(await this.tableExists(qr, 'sync_logs'))) {
      await qr.query(`
        CREATE TABLE \`sync_logs\` (
          \`id\`              INT         NOT NULL AUTO_INCREMENT,
          \`sync_type\`       ENUM('full','incremental','live_check','upcoming','stats') NOT NULL,
          \`videos_added\`    INT         NOT NULL DEFAULT 0,
          \`videos_updated\`  INT         NOT NULL DEFAULT 0,
          \`errors\`          TEXT        NULL,
          \`duration_ms\`     INT         NULL,
          \`started_at\`      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`completed_at\`    DATETIME    NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: sync_logs');
    } else {
      this.log('⏭   Exists:  sync_logs');
    }

    // ── 10. moments (depends on videos) ───────────────────────────────────────
    if (!(await this.tableExists(qr, 'moments'))) {
      await qr.query(`
        CREATE TABLE \`moments\` (
          \`id\`              INT          NOT NULL AUTO_INCREMENT,
          \`type\`            ENUM('declaration','prayer','testimony') NOT NULL,
          \`title\`           VARCHAR(300) NOT NULL,
          \`youtube_id\`      VARCHAR(20)  NOT NULL,
          \`video_id\`        INT          NULL,
          \`start_time\`      INT          NOT NULL,
          \`end_time\`        INT          NOT NULL,
          \`thumbnail_url\`   VARCHAR(500) NULL,
          \`sermon_title\`    VARCHAR(500) NULL,
          \`transcript_text\` TEXT         NULL,
          \`created_at\`      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          INDEX \`idx_moments_youtube_id\`       (\`youtube_id\`),
          INDEX \`idx_moments_video_type\`       (\`video_id\`, \`type\`),
          INDEX \`idx_moments_type_created_at\`  (\`type\`, \`created_at\`),
          CONSTRAINT \`FK_moments_video\` FOREIGN KEY (\`video_id\`) REFERENCES \`videos\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: moments');
    } else {
      this.log('⏭   Exists:  moments');
    }

    // ── 11. prayer_requests (standalone) ──────────────────────────────────────
    if (!(await this.tableExists(qr, 'prayer_requests'))) {
      await qr.query(`
        CREATE TABLE \`prayer_requests\` (
          \`id\`         VARCHAR(36) NOT NULL,
          \`name\`       VARCHAR(150) NOT NULL,
          \`category\`   ENUM('healing','financial','family','career','marriage','salvation','other') NOT NULL,
          \`request\`    TEXT         NOT NULL,
          \`userId\`     VARCHAR(36)  NULL,
          \`approved\`   TINYINT(1)   NOT NULL DEFAULT 0,
          \`createdAt\`  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: prayer_requests');
    } else {
      this.log('⏭   Exists:  prayer_requests');
    }

    // ── 12. device_tokens (standalone) ────────────────────────────────────────
    if (!(await this.tableExists(qr, 'device_tokens'))) {
      await qr.query(`
        CREATE TABLE \`device_tokens\` (
          \`id\`        INT          NOT NULL AUTO_INCREMENT,
          \`userId\`    INT          NOT NULL,
          \`token\`     VARCHAR(500) NOT NULL,
          \`platform\`  VARCHAR(20)  NOT NULL DEFAULT 'android',
          \`createdAt\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_device_tokens_user_token\` (\`userId\`, \`token\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      this.log('✅  Created table: device_tokens');
    } else {
      this.log('⏭   Exists:  device_tokens');
    }

    this.log('🏁  CreateAllTables complete.');
  }

  // ─── down ───────────────────────────────────────────────────────────────────

  public async down(qr: QueryRunner): Promise<void> {
    // Drop in reverse FK-dependency order
    const tables = [
      'device_tokens', 'prayer_requests', 'moments', 'sync_logs',
      'bookmarks', 'watch_history', 'video_categories',
      'clips', 'events', 'categories', 'videos', 'users',
    ];
    // Disable FK checks so we can drop in bulk safely
    await qr.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tables) {
      await qr.query(`DROP TABLE IF EXISTS \`${t}\``);
      this.log(`🗑   Dropped: ${t}`);
    }
    await qr.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}
