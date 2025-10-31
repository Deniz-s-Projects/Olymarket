import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityDiscussions1766000000000
  implements MigrationInterface
{
  name = "AddCommunityDiscussions1766000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_discussions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(150) NOT NULL,
        "body" text NOT NULL,
        "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_discussions_author" ON "community_discussions" ("author_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_discussions_created" ON "community_discussions" ("created_at")`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "body" text NOT NULL,
        "discussion_id" uuid NOT NULL REFERENCES "community_discussions"("id") ON DELETE CASCADE,
        "author_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_comments_discussion" ON "community_comments" ("discussion_id")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_comments_author" ON "community_comments" ("author_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_comments_author"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_comments_discussion"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "community_comments"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_discussions_created"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_discussions_author"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "community_discussions"`);
  }
}
