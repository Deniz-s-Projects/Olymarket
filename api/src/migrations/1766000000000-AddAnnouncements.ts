import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnnouncements1766000000000 implements MigrationInterface {
  name = "AddAnnouncements1766000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(150) NOT NULL,
        "body" text NOT NULL,
        "publish_from" TIMESTAMPTZ NOT NULL,
        "publish_to" TIMESTAMPTZ,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_announcements_publish_from" ON "announcements" ("publish_from")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_announcements_is_pinned" ON "announcements" ("is_pinned")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "announcement_audiences" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "announcement_id" uuid NOT NULL REFERENCES "announcements"("id") ON DELETE CASCADE,
        "type" varchar(50) NOT NULL,
        "value" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_announcement_audience_announcement" ON "announcement_audiences" ("announcement_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_announcement_audience_type" ON "announcement_audiences" ("type")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_announcement_audience_type"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_announcement_audience_announcement"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "announcement_audiences"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_announcements_is_pinned"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_announcements_publish_from"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements"`);
  }
}
