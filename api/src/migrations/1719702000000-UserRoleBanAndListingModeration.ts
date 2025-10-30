import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRoleBanAndListingModeration1719702000000 implements MigrationInterface {
  name = "UserRoleBanAndListingModeration1719702000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // User role enum and ban columns
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('user', 'admin');
      END IF;
    END $$;`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" user_role_enum NOT NULL DEFAULT 'user'`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_banned" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ban_reason" text NULL`);

    // Backfill users
    await queryRunner.query(`UPDATE "users" SET role = 'user' WHERE role IS NULL`);
    await queryRunner.query(`UPDATE "users" SET is_banned = false WHERE is_banned IS NULL`);

    // Listing moderation enum and columns
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_moderation_enum') THEN
        CREATE TYPE listing_moderation_enum AS ENUM ('pending', 'approved', 'rejected');
      END IF;
    END $$;`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "moderation_status" listing_moderation_enum NOT NULL DEFAULT 'pending'`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "moderation_notes" text NULL`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "reviewer_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL`);

    // Backfill listings (existing content set to approved)
    await queryRunner.query(`UPDATE "listings" SET moderation_status = 'approved' WHERE moderation_status IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "reviewer_id"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "reviewed_at"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "moderation_notes"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "moderation_status"`);
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_moderation_enum') THEN
        DROP TYPE listing_moderation_enum;
      END IF;
    END $$;`);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "ban_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "banned_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_banned"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        DROP TYPE user_role_enum;
      END IF;
    END $$;`);
  }
}


