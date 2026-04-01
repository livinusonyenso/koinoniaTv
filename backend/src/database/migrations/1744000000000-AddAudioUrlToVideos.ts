import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudioUrlToVideos1744000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`videos\` ADD COLUMN \`audio_url\` VARCHAR(1000) NULL DEFAULT NULL AFTER \`is_featured\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`videos\` DROP COLUMN \`audio_url\``,
    );
  }
}
