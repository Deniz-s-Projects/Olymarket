import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityGroups1730420000000 implements MigrationInterface {
  name = "AddCommunityGroups1730420000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create groups table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "description" text,
        "type" varchar NOT NULL DEFAULT 'interest',
        "is_active" boolean NOT NULL DEFAULT true,
        "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_group_type" CHECK ("type" IN ('hobby', 'interest', 'block'))
      )
    `);

    // Create group_members table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "group_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "role" varchar NOT NULL DEFAULT 'member',
        "joined_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "group_id" uuid NOT NULL REFERENCES "groups"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_group_member_role" CHECK ("role" IN ('member', 'moderator')),
        CONSTRAINT "UQ_group_member" UNIQUE ("group_id", "user_id")
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_group_type" ON "groups" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_group_owner" ON "groups" ("owner_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_group_member_group" ON "group_members" ("group_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_group_member_user" ON "group_members" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_member_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_member_group"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_owner"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_group_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "group_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "groups"`);
  }
}
