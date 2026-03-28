/**
 * TypeORM DataSource for CLI migration commands.
 *
 * Usage:
 *   npx typeorm-ts-node-commonjs migration:run   -d src/database/data-source.ts
 *   npx typeorm-ts-node-commonjs migration:revert -d src/database/data-source.ts
 *   npx typeorm-ts-node-commonjs migration:show   -d src/database/data-source.ts
 *   npx typeorm-ts-node-commonjs migration:generate src/database/migrations/MyMigration -d src/database/data-source.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  connectorPackage: 'mysql2',
  host:     process.env.DB_HOST     || 'localhost',
  port:     +(process.env.DB_PORT   || 3306),
  database: process.env.DB_NAME     || 'koinonia_tv',
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',

  // Source-level entity & migration paths (used by CLI, not the app runtime)
  entities:   ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],

  synchronize:   false,
  migrationsRun: false,   // CLI controls execution; app uses migrationsRun:true in app.module

  logging: ['query', 'error', 'migration'],
});
