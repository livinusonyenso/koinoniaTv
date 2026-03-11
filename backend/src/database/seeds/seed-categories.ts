// Run: npx ts-node src/database/seeds/seed-categories.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const ds = new DataSource({
  type: 'mysql',
  driver: require('mysql2'),
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'koinonia_tv',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  entities: ['src/**/*.entity.ts'],
  synchronize: true,
});

const CATEGORIES = [
  { name: 'Faith',          slug: 'faith',          iconName: 'heart',       colorHex: '#E53935', sortOrder: 1 },
  { name: 'Favor',          slug: 'favor',           iconName: 'star',        colorHex: '#FFB300', sortOrder: 2 },
  { name: 'Prayer',         slug: 'prayer',          iconName: 'hands-pray',  colorHex: '#1565C0', sortOrder: 3 },
  { name: 'Spiritual Growth', slug: 'spiritual-growth', iconName: 'seedling', colorHex: '#2E7D32', sortOrder: 4 },
  { name: 'Wisdom',         slug: 'wisdom',          iconName: 'lightbulb',   colorHex: '#6A1B9A', sortOrder: 5 },
  { name: 'Relationships',  slug: 'relationships',   iconName: 'users',       colorHex: '#00838F', sortOrder: 6 },
  { name: 'Purpose',        slug: 'purpose',         iconName: 'compass',     colorHex: '#E65100', sortOrder: 7 },
  { name: 'Deliverance',    slug: 'deliverance',     iconName: 'shield',      colorHex: '#37474F', sortOrder: 8 },
];

async function seed() {
  await ds.initialize();
  const repo = ds.getRepository('categories');
  for (const cat of CATEGORIES) {
    const exists = await repo.findOne({ where: { slug: cat.slug } });
    if (!exists) {
      await repo.save(repo.create(cat));
      console.log(`✅  Created: ${cat.name}`);
    } else {
      console.log(`⏭   Exists:  ${cat.name}`);
    }
  }
  await ds.destroy();
  console.log('\n🌱  Categories seeded!');
}

seed().catch(console.error);
