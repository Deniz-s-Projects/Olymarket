import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingComments1767000000000 implements MigrationInterface {
  name = "AddListingComments1767000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "listing_comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "body" text NOT NULL,
        "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
        "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_listing_comments_listing" ON "listing_comments" ("listing_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_listing_comments_author" ON "listing_comments" ("author_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_listing_comments_created" ON "listing_comments" ("created_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_listing_comments_created"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_listing_comments_author"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_listing_comments_listing"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "listing_comments"`);
  }
}
