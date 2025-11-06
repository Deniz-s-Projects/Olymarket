import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShowContactInfoToListings1769000000000 implements MigrationInterface {
  name = "AddShowContactInfoToListings1769000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listings" ADD "show_contact_info" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "show_contact_info"`);
  }
}
