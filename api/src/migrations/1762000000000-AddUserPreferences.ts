import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserPreferences1762000000000 implements MigrationInterface {
  name = "AddUserPreferences1762000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "marketplace_alerts" boolean NOT NULL DEFAULT false,
        "saved_search_digests" boolean NOT NULL DEFAULT false,
        "community_news" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_user_preferences_user_id" ON "user_preferences" ("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_user_preferences_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_preferences"`);
  }
}
