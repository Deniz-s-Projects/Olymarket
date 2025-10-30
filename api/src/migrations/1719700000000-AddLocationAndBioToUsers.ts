import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationAndBioToUsers1719700000000 implements MigrationInterface {
  name = "AddLocationAndBioToUsers1719700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "location" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bio"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "location"`);
  }
}


