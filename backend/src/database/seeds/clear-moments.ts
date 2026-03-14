// Run: npx ts-node src/database/seeds/clear-moments.ts
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
  entities: [],
  synchronize: false,
});

async function main() {
  await ds.initialize();

  const { affected } = await ds.query('DELETE FROM moments');
  console.log(`✅ Deleted ${affected ?? '(all)'} moments. Table is now empty.`);

  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
