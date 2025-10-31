import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoldAtToListings1765000000000 implements MigrationInterface {
  name = "AddSoldAtToListings1765000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" ADD "sold_at" TIMESTAMP`);
    await queryRunner.query(`
      UPDATE "listings"
      SET "sold_at" = COALESCE("updated_at", NOW())
      WHERE "status" = 'sold'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "sold_at"`);
  }
}
