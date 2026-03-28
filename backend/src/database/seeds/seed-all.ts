/**
 * seed-all.ts — Master standalone seeder
 *
 * Connects directly to MySQL (bypassing NestJS) and seeds ALL reference data.
 * Safe to run multiple times — every insert is guarded by an existence check.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-all.ts
 *
 * Or via package.json script:
 *   npm run seed
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── DataSource ──────────────────────────────────────────────────────────────

const ds = new DataSource({
  type:     'mysql',
  connectorPackage: 'mysql2',
  host:     process.env.DB_HOST     || 'localhost',
  port:     +(process.env.DB_PORT   || 3306),
  database: process.env.DB_NAME     || 'koinonia_tv',
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  synchronize:   false,
  migrationsRun: false,
  entities:      [],
  logging:       false,
});

// ─── Logging ─────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

function log(msg: string)  { console.log(`  ${msg}`); }
function ok(msg: string)   { console.log(`  ${GREEN}✅  ${msg}${RESET}`); }
function skip(msg: string) { console.log(`  ${YELLOW}⏭   ${msg}${RESET}`); }
function err(msg: string)  { console.log(`  ${RED}❌  ${msg}${RESET}`); }
function section(title: string) {
  console.log(`\n${BOLD}${CYAN}▸ ${title}${RESET}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function tableExists(table: string): Promise<boolean> {
  const rows: any[] = await ds.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function rowExists(table: string, column: string, value: string | number): Promise<boolean> {
  const rows: any[] = await ds.query(
    `SELECT 1 FROM \`${table}\` WHERE \`${column}\` = ? LIMIT 1`,
    [value],
  );
  return rows.length > 0;
}

// ─── Seed: categories ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Faith',              slug: 'faith',              iconName: 'heart',            colorHex: '#E53935', sortOrder: 1  },
  { name: 'Favor',              slug: 'favor',              iconName: 'star',             colorHex: '#FFB300', sortOrder: 2  },
  { name: 'Prayer',             slug: 'prayer',             iconName: 'hands-pray',       colorHex: '#1565C0', sortOrder: 3  },
  { name: 'Spiritual Growth',   slug: 'spiritual-growth',   iconName: 'seedling',         colorHex: '#2E7D32', sortOrder: 4  },
  { name: 'Wisdom',             slug: 'wisdom',             iconName: 'lightbulb',        colorHex: '#6A1B9A', sortOrder: 5  },
  { name: 'Relationships',      slug: 'relationships',      iconName: 'users',            colorHex: '#00838F', sortOrder: 6  },
  { name: 'Purpose',            slug: 'purpose',            iconName: 'compass',          colorHex: '#E65100', sortOrder: 7  },
  { name: 'Deliverance',        slug: 'deliverance',        iconName: 'shield',           colorHex: '#37474F', sortOrder: 8  },
  { name: 'Miracle Service',    slug: 'miracle-service',    iconName: 'lightning-bolt',   colorHex: '#FF6F00', sortOrder: 9  },
  { name: 'School of Ministry', slug: 'school-of-ministry', iconName: 'school',           colorHex: '#1A237E', sortOrder: 10 },
  { name: 'Songs',              slug: 'songs',              iconName: 'music-note-whole', colorHex: '#AD1457', sortOrder: 11 },
  { name: 'Declarations',       slug: 'declarations',       iconName: 'bullhorn',         colorHex: '#00695C', sortOrder: 12 },
];

async function seedCategories(): Promise<{ inserted: number; skipped: number }> {
  section('Categories');
  let inserted = 0;
  let skipped  = 0;

  if (!(await tableExists('categories'))) {
    err('categories table does not exist — run migrations first');
    return { inserted, skipped };
  }

  for (const cat of CATEGORIES) {
    if (await rowExists('categories', 'slug', cat.slug)) {
      skip(`${cat.name}`);
      skipped++;
    } else {
      await ds.query(
        `INSERT INTO categories (name, slug, icon_name, color_hex, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [cat.name, cat.slug, cat.iconName, cat.colorHex, cat.sortOrder],
      );
      ok(`Created: ${cat.name}`);
      inserted++;
    }
  }

  return { inserted, skipped };
}

// ─── Seed: sample events ──────────────────────────────────────────────────────
// Placeholder upcoming events so the app has something to display.
// Add real events via the admin API; these are only inserted on a fresh DB.

const SAMPLE_EVENTS = [
  {
    title:           'Koinonia Global Sunday Service',
    description:     'Weekly Sunday worship service with Apostle Joshua Selman.',
    event_type:      'service',
    start_datetime:  '2026-04-06 09:00:00',
    end_datetime:    '2026-04-06 12:00:00',
    location_name:   'Koinonia Global Headquarters',
    location_city:   'Zaria',
    location_country:'Nigeria',
    is_online:       1,
    live_stream_url: 'https://www.youtube.com/@KoinoniaGlobal',
  },
  {
    title:           'School of Ministry — April Session',
    description:     'Monthly intensive training for ministers and believers.',
    event_type:      'special',
    start_datetime:  '2026-04-12 08:00:00',
    end_datetime:    '2026-04-14 17:00:00',
    location_name:   'Koinonia Global Headquarters',
    location_city:   'Zaria',
    location_country:'Nigeria',
    is_online:       0,
  },
];

async function seedSampleEvents(): Promise<{ inserted: number; skipped: number }> {
  section('Sample Events');
  let inserted = 0;
  let skipped  = 0;

  if (!(await tableExists('events'))) {
    err('events table does not exist — run migrations first');
    return { inserted, skipped };
  }

  for (const ev of SAMPLE_EVENTS) {
    const existing: any[] = await ds.query(
      'SELECT id FROM events WHERE title = ? AND start_datetime = ? LIMIT 1',
      [ev.title, ev.start_datetime],
    );

    if (existing.length > 0) {
      skip(`${ev.title}`);
      skipped++;
    } else {
      await ds.query(
        `INSERT INTO events
           (title, description, event_type, start_datetime, end_datetime,
            location_name, location_city, location_country, is_online, live_stream_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ev.title,
          ev.description  ?? null,
          ev.event_type,
          ev.start_datetime,
          ev.end_datetime ?? null,
          ev.location_name ?? null,
          ev.location_city ?? null,
          ev.location_country ?? null,
          ev.is_online ?? 0,
          (ev as any).live_stream_url ?? null,
        ],
      );
      ok(`Created: ${ev.title}`);
      inserted++;
    }
  }

  return { inserted, skipped };
}

// ─── Schema verification report ───────────────────────────────────────────────

async function verifySchema(): Promise<void> {
  section('Schema Verification');

  const expectedTables = [
    'users', 'videos', 'categories', 'video_categories',
    'clips', 'events', 'watch_history', 'bookmarks',
    'sync_logs', 'moments', 'prayer_requests', 'device_tokens',
  ];

  const present: string[] = [];
  const missing: string[] = [];

  for (const table of expectedTables) {
    (await tableExists(table) ? present : missing).push(table);
  }

  log(`Present (${present.length}/${expectedTables.length}): ${present.join(', ')}`);

  if (missing.length) {
    err(`Missing (${missing.length}): ${missing.join(', ')}`);
    err('Run: npm run migration:run');
  } else {
    ok('All expected tables are present');
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}══════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${CYAN}   Koinonia TV — Master Seeder         ${RESET}`);
  console.log(`${BOLD}${CYAN}   DB: ${process.env.DB_NAME} @ ${process.env.DB_HOST}${RESET}`);
  console.log(`${BOLD}${CYAN}══════════════════════════════════════${RESET}`);

  await ds.initialize();
  console.log('\n🔌  Connected to database');

  await verifySchema();

  const catResult   = await seedCategories();
  const evResult    = await seedSampleEvents();

  // ─── Final summary ──────────────────────────────────────────────────────────
  console.log(`\n${BOLD}${CYAN}── SEED SUMMARY ──────────────────────${RESET}`);
  console.log(`  Categories — inserted: ${catResult.inserted}, skipped: ${catResult.skipped}`);
  console.log(`  Events     — inserted: ${evResult.inserted},  skipped: ${evResult.skipped}`);
  console.log(`${BOLD}${CYAN}──────────────────────────────────────${RESET}\n`);

  await ds.destroy();
  console.log('🏁  Seeder complete.\n');
}

main().catch((e) => {
  console.error('\n❌  Seeder failed:', e);
  process.exit(1);
});
