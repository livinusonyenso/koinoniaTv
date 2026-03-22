import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsEnabledToUsers1710892800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Guard: the column may already exist if synchronize:true ran before migrations
    const table = await queryRunner.getTable('users');
    if (!table?.findColumnByName('notifications_enabled')) {
      await queryRunner.query(
        `ALTER TABLE \`users\` ADD \`notifications_enabled\` tinyint(1) NOT NULL DEFAULT 1`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    if (table?.findColumnByName('notifications_enabled')) {
      await queryRunner.query(
        `ALTER TABLE \`users\` DROP COLUMN \`notifications_enabled\``,
      );
    }
  }
}
