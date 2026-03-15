/**
 * Standalone video-categories seeder — no NestJS server needed.
 * Run: npx ts-node src/database/seeds/seed-video-categories.ts
 *
 * What it does:
 *  1. Deletes ALL keyword-tagged rows in video_categories
 *  2. Fetches every non-live video (id, title, description)
 *  3. Re-applies all keyword + event-pattern rules
 *  4. Inserts matched category rows
 *  5. Prints per-category counts at the end
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// ── DB connection ─────────────────────────────────────────────────────────────

const ds = new DataSource({
  type: 'mysql',
  driver: require('mysql2'),
  host:     process.env.DB_HOST     || 'localhost',
  port:     +(process.env.DB_PORT   || 3306),
  database: process.env.DB_NAME     || 'koinonia_tv',
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  entities: [],
  synchronize: false,
});

// ── Keyword dictionaries (mirrors categorization.service.ts) ─────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  faith: [
    'faith', 'believe', 'belief', 'trust', 'salvation', 'grace', 'righteousness',
    'justified', 'sanctified', 'redemption', 'covenant',
  ],
  favor: [
    'favour', 'favor', 'blessing', 'blessed', 'abundance', 'prosperity', 'prosperous',
    'breakthrough', 'mercy', 'advantage', 'promotion', 'increase', 'open doors',
  ],
  prayer: [
    'prayer', 'pray', 'intercession', 'intercede', 'supplication', 'fasting',
    'fast', 'warfare', 'commune', 'petition', 'decree',
  ],
  'spiritual-growth': [
    'growth', 'transformation', 'maturity', 'discipline', 'character', 'intimacy',
    'anointing', 'consecration', 'holy spirit', 'sanctification', 'spiritual',
  ],
  wisdom: [
    'wisdom', 'understanding', 'knowledge', 'revelation', 'insight', 'discernment',
    'intelligence', 'counsel', 'strategy', 'prudence', 'wise',
  ],
  relationships: [
    'marriage', 'family', 'relationship', 'love', 'friendship', 'fellowship',
    'community', 'unity', 'partnership', 'husband', 'wife', 'children',
  ],
  purpose: [
    'purpose', 'destiny', 'calling', 'mandate', 'assignment', 'vision', 'mission',
    'potential', 'greatness', 'fulfillment', 'called', 'anointed',
  ],
  deliverance: [
    'deliverance', 'freedom', 'bondage', 'victory', 'overcome', 'liberate',
    'stronghold', 'captive', 'chains', 'darkness', 'spiritual warfare',
  ],
};

const EVENT_PATTERNS: Array<{ pattern: RegExp; categories: string[] }> = [
  { pattern: /miracle service/i,          categories: ['prayer', 'faith']            },
  { pattern: /school of ministry|ksom/i,  categories: ['wisdom', 'spiritual-growth'] },
  { pattern: /shout of the king/i,        categories: ['faith', 'favor']             },
  { pattern: /prophetic declaration/i,    categories: ['faith', 'purpose']           },
  { pattern: /sound of revival/i,         categories: ['spiritual-growth', 'faith']  },
  { pattern: /restoring the order/i,      categories: ['wisdom', 'spiritual-growth'] },
  { pattern: /healing to the nations/i,   categories: ['faith', 'deliverance']       },
  { pattern: /power of the word/i,        categories: ['spiritual-growth', 'wisdom'] },
  { pattern: /mystery of/i,               categories: ['wisdom']                     },
  { pattern: /understanding (the|your)/i, categories: ['wisdom']                     },
];

// ── Scoring helper ────────────────────────────────────────────────────────────

function scoreVideo(title: string, description: string | null): Map<string, number> {
  const text = `${title} ${(description || '').slice(0, 600)}`.toLowerCase();
  const scored = new Map<string, number>();

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let hits = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) hits++;
    }
    if (hits >= 1) {
      scored.set(slug, Math.min(0.60 + hits * 0.10, 0.95));
    }
  }

  for (const { pattern, categories } of EVENT_PATTERNS) {
    if (pattern.test(title)) {
      for (const slug of categories) {
        scored.set(slug, Math.max(scored.get(slug) ?? 0, 0.95));
      }
    }
  }

  return scored;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await ds.initialize();
  console.log('✅ Connected to database\n');

  // 1. Load categories from DB
  const catRows: Array<{ id: number; slug: string; name: string }> = await ds.query(
    'SELECT id, slug, name FROM categories ORDER BY sort_order ASC',
  );
  if (!catRows.length) {
    console.error('❌  No categories found! Run seed-categories.ts first.');
    await ds.destroy();
    process.exit(1);
  }
  console.log(`📂  Categories loaded: ${catRows.map(c => c.name).join(', ')}\n`);
  const catMap = new Map(catRows.map(c => [c.slug, c.id]));

  // 2. Delete all keyword-tagged rows (keep manual tags safe)
  const del = await ds.query(`DELETE FROM video_categories WHERE tagged_by = 'keyword'`);
  console.log(`🗑️  Cleared keyword-tagged rows (${del.affectedRows ?? 0} deleted)\n`);

  // 3. Fetch all processable videos
  const videos: Array<{ id: number; title: string; description: string | null }> =
    await ds.query(
      `SELECT id, title, LEFT(description, 600) AS description
       FROM videos
       WHERE is_live = 0 AND is_upcoming = 0`,
    );
  console.log(`📹  Videos to process: ${videos.length}\n`);

  // 4. Score and insert
  const counts = new Map<string, number>(catRows.map(c => [c.slug, 0]));
  let totalInserted = 0;

  for (const video of videos) {
    const scored = scoreVideo(video.title, video.description);
    for (const [slug, score] of scored.entries()) {
      const catId = catMap.get(slug);
      if (!catId) continue;
      await ds.query(
        `INSERT IGNORE INTO video_categories
           (video_id, category_id, confidence_score, tagged_by, created_at)
         VALUES (?, ?, ?, 'keyword', NOW())`,
        [video.id, catId, score],
      );
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
      totalInserted++;
    }
  }

  // 5. Report
  console.log('📊  Results per category:');
  for (const cat of catRows) {
    const n = counts.get(cat.slug) ?? 0;
    const bar = '█'.repeat(Math.min(Math.round(n / 10), 50));
    console.log(`   ${cat.name.padEnd(18)} ${String(n).padStart(5)}  ${bar}`);
  }
  console.log(`\n✅  Done! Total rows inserted: ${totalInserted}`);

  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
