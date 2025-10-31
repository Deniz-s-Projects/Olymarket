import { MigrationInterface, QueryRunner } from "typeorm";

export class AddListingExpiry1768000000000 implements MigrationInterface {
  name = "AddListingExpiry1768000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listings" ADD COLUMN "expires_at" TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days')`,
    );

    await queryRunner.query(
      `UPDATE "listings" SET "expires_at" = "created_at" + INTERVAL '30 days' WHERE "status" = 'active'`,
    );

    await queryRunner.query(
      `ALTER TYPE "public"."listings_status_enum" ADD VALUE IF NOT EXISTS 'expired'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "listings" SET "status" = 'draft' WHERE "status" = 'expired'`);

    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "expires_at"`);

    await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `CREATE TYPE "public"."listings_status_enum_old" AS ENUM('active', 'draft', 'sold')`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ALTER COLUMN "status" TYPE "public"."listings_status_enum_old" USING "status"::text::"public"."listings_status_enum_old"`,
    );
    await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'active'`);
    await queryRunner.query(`DROP TYPE "public"."listings_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."listings_status_enum_old" RENAME TO "listings_status_enum"`,
    );
  }
}
