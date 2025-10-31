import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingsIndexes1764000000000 implements MigrationInterface {
    name = 'AddListingsIndexes1764000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_moderation_status" ON "listings" ("moderation_status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_is_active" ON "listings" ("is_active")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_is_free" ON "listings" ("is_free")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_category_id" ON "listings" ("category_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_owner_id" ON "listings" ("owner_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_created_at" ON "listings" ("created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_price" ON "listings" ("price")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_users_is_banned" ON "users" ("is_banned")`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_title_trgm" ON "listings" USING GIN ("title" gin_trgm_ops)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_listings_description_trgm" ON "listings" USING GIN ("description" gin_trgm_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_description_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_title_trgm"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "pg_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_users_is_banned"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_price"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_owner_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_category_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_is_free"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_is_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_listings_moderation_status"`);
    }
}
