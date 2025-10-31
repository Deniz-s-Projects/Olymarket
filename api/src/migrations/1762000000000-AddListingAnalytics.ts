import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingAnalytics1762000000000 implements MigrationInterface {
  name = "AddListingAnalytics1762000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" ADD "views_count" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "listings" ADD "saves_count" integer NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "saves_count"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "views_count"`);
  }
}
