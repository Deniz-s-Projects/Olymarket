import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserHydrationEntries1762001000000 implements MigrationInterface {
  name = "AddUserHydrationEntries1762001000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_hydration_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "amount_ml" integer NOT NULL,
        "recorded_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_hydration_entries_user_id"
      ON "user_hydration_entries" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_hydration_entries_recorded_at"
      ON "user_hydration_entries" ("recorded_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_hydration_entries_recorded_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_hydration_entries_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_hydration_entries"`);
  }
}
