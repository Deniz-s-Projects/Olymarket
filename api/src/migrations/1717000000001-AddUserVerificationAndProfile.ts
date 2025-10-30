import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserVerificationAndProfile1717000000001 implements MigrationInterface {
  name = "AddUserVerificationAndProfile1717000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "is_verified" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "verification_code_hash" varchar NULL,
      ADD COLUMN IF NOT EXISTS "verification_code_expires_at" TIMESTAMP NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "location" varchar(150) NULL,
        "bio" text NULL,
        "notify_new_listings" boolean NOT NULL DEFAULT true,
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "verification_code_expires_at",
      DROP COLUMN IF EXISTS "verification_code_hash",
      DROP COLUMN IF EXISTS "is_verified"
    `);
  }
}
