import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsEnabledToUsers1710892800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`notifications_enabled\` tinyint(1) NOT NULL DEFAULT 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP COLUMN \`notifications_enabled\``,
    );
  }
}
