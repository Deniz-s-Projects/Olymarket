import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupEventsAndPosts1762100000000
  implements MigrationInterface
{
  name = "AddGroupEventsAndPosts1762100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(150) NOT NULL,
        "description" text,
        "start_at" TIMESTAMPTZ NOT NULL,
        "end_at" TIMESTAMPTZ,
        "location" varchar(255),
        "is_all_day" boolean NOT NULL DEFAULT false,
        "rsvp_deadline" TIMESTAMPTZ,
        "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
        "creator_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_events_group" ON "group_events" ("group_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_events_start" ON "group_events" ("start_at")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_posts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(150),
        "body" text NOT NULL,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "is_archived" boolean NOT NULL DEFAULT false,
        "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
        "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "event_id" uuid REFERENCES "group_events"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_posts_group" ON "group_posts" ("group_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_posts_event" ON "group_posts" ("event_id")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "body" text NOT NULL,
        "post_id" uuid NOT NULL REFERENCES "group_posts"("id") ON DELETE CASCADE,
        "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_comments_post" ON "group_comments" ("post_id")`
    );

    await queryRunner.query(
      `CREATE TYPE "group_event_rsvps_status_enum" AS ENUM('going', 'maybe', 'not_going')`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_event_rsvps" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL REFERENCES "group_events"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "status" "group_event_rsvps_status_enum" NOT NULL DEFAULT 'going',
        "reminder_sent_at" TIMESTAMPTZ,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_group_event_rsvp" UNIQUE ("event_id", "user_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_event_rsvps_event" ON "group_event_rsvps" ("event_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_group_event_rsvps_user" ON "group_event_rsvps" ("user_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_event_rsvps_user"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_event_rsvps_event"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "group_event_rsvps"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "group_event_rsvps_status_enum"`
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_comments_post"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "group_comments"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_posts_event"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_posts_group"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "group_posts"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_events_start"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_group_events_group"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "group_events"`);
  }
}
