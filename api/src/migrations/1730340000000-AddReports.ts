import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReports1730340000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "report_type_enum" AS ENUM ('listing', 'user');
    `);

    await queryRunner.query(`
      CREATE TYPE "report_status_enum" AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');
    `);

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "report_type" report_type_enum NOT NULL,
        "reason" text NOT NULL,
        "description" text,
        "status" report_status_enum NOT NULL DEFAULT 'pending',
        "resolution_notes" text,
        "resolved_at" timestamp,
        "reporter_id" uuid NOT NULL,
        "reported_user_id" uuid,
        "reported_listing_id" uuid,
        "reviewed_by_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reported_user" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reported_listing" FOREIGN KEY ("reported_listing_id") REFERENCES "listings"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_reviewed_by" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reports_status" ON "reports"("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reports_type" ON "reports"("report_type");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reports_reporter" ON "reports"("reporter_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_reports_created_at" ON "reports"("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_reports_created_at"`);
    await queryRunner.query(`DROP INDEX "idx_reports_reporter"`);
    await queryRunner.query(`DROP INDEX "idx_reports_type"`);
    await queryRunner.query(`DROP INDEX "idx_reports_status"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TYPE "report_status_enum"`);
    await queryRunner.query(`DROP TYPE "report_type_enum"`);
  }
}
