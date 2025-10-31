import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConditionToListings1766000000000 implements MigrationInterface {
  name = "AddConditionToListings1766000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."listings_condition_enum" AS ENUM('new', 'good', 'used_but_works', 'fixer_upper')`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD "condition" "public"."listings_condition_enum" NOT NULL DEFAULT 'used_but_works'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "condition"`);
    await queryRunner.query(`DROP TYPE "public"."listings_condition_enum"`);
  }
}
