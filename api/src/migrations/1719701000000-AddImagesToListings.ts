import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImagesToListings1719701000000 implements MigrationInterface {
  name = "AddImagesToListings1719701000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT ARRAY[]::text[]`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "images"`);
  }
}


