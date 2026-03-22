import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoIndexes1711100000000 implements MigrationInterface {
  name = 'AddVideoIndexes1711100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Index for GET /videos/latest  (ORDER BY published_at DESC)
    await queryRunner.query(
      `CREATE INDEX \`idx_videos_published_at\` ON \`videos\` (\`published_at\` DESC)`,
    );

    // Index for GET /videos/trending (ORDER BY view_count DESC)
    await queryRunner.query(
      `CREATE INDEX \`idx_videos_view_count\` ON \`videos\` (\`view_count\` DESC)`,
    );

    // Composite unique on video_categories join table
    // (prevents duplicate (video_id, category_id) pairs and speeds up JOIN lookups)
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`idx_video_categories_composite\` ON \`video_categories\` (\`video_id\`, \`category_id\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_videos_published_at\` ON \`videos\``);
    await queryRunner.query(`DROP INDEX \`idx_videos_view_count\` ON \`videos\``);
    await queryRunner.query(`DROP INDEX \`idx_video_categories_composite\` ON \`video_categories\``);
  }
}
