import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWantedListings1762100000000 implements MigrationInterface {
  name = "AddWantedListings1762100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."wanted_listings_status_enum" AS ENUM('open', 'matched', 'fulfilled', 'cancelled')`,
    );
    await queryRunner.query(`
      CREATE TABLE "wanted_listings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "title" character varying(150) NOT NULL,
        "details" text,
        "budget" numeric(10,2) NOT NULL,
        "status" "public"."wanted_listings_status_enum" NOT NULL DEFAULT 'open',
        "buyer_id" uuid NOT NULL,
        "category_id" uuid,
        "fulfilling_seller_id" uuid,
        "fulfilled_at" TIMESTAMP,
        "conversation_id" uuid,
        CONSTRAINT "PK_wanted_listings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_wanted_listings_buyer" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wanted_listings_category" FOREIGN KEY ("category_id") REFERENCES "listing_categories"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_wanted_listings_fulfilling_seller" FOREIGN KEY ("fulfilling_seller_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_wanted_listings_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_wanted_listings_buyer" ON "wanted_listings" ("buyer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_wanted_listings_status" ON "wanted_listings" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_wanted_listings_category" ON "wanted_listings" ("category_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_wanted_listings_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wanted_listings_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wanted_listings_buyer"`);
    await queryRunner.query(`DROP TABLE "wanted_listings"`);
    await queryRunner.query(`DROP TYPE "public"."wanted_listings_status_enum"`);
  }
}
