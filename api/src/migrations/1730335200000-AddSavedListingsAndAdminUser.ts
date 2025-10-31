import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSavedListingsAndAdminUser1730335200000 implements MigrationInterface {
  name = "AddSavedListingsAndAdminUser1730335200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create saved_listings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "saved_listings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_saved_listing_user_listing" UNIQUE ("user_id", "listing_id")
      )
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_listings_user_id" ON "saved_listings" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_saved_listings_listing_id" ON "saved_listings" ("listing_id")
    `);

    // Insert hardcoded admin user
    // SECURITY NOTE: This is a development/demo credential.
    // In production, change this password immediately or use environment variables.
    // Email: admin@olymarket.com
    // Password: Admin@2024
    await queryRunner.query(`
      INSERT INTO "users" ("email", "password_hash", "name", "role", "location", "bio")
      VALUES (
        'admin@olymarket.com',
        '$2a$10$itCan.uqZLcfmCf4hB5bEOGkN74AzyO.cPYS9ML4P4Lz8ofLvWIHy',
        'Admin User',
        'admin',
        'Olydorf',
        'System Administrator'
      )
      ON CONFLICT (email) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove admin user
    await queryRunner.query(`
      DELETE FROM "users" WHERE "email" = 'admin@olymarket.com'
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_saved_listings_listing_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_saved_listings_user_id"`);

    // Drop saved_listings table
    await queryRunner.query(`DROP TABLE IF EXISTS "saved_listings"`);
  }
}
