import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingNotices1771000000000 implements MigrationInterface {
  name = "AddListingNotices1771000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "CREATE TYPE \"public\".\"listings_admin_notice_severity_enum\" AS ENUM('info', 'warning', 'danger')",
    );
    await queryRunner.query("ALTER TABLE \"listings\" ADD \"admin_notice\" text");
    await queryRunner.query(
      "ALTER TABLE \"listings\" ADD \"admin_notice_severity\" \"public\".\"listings_admin_notice_severity_enum\" NOT NULL DEFAULT 'info'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE \"listings\" DROP COLUMN \"admin_notice_severity\"");
    await queryRunner.query("ALTER TABLE \"listings\" DROP COLUMN \"admin_notice\"");
    await queryRunner.query("DROP TYPE \"public\".\"listings_admin_notice_severity_enum\"");
  }
}
