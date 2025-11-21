import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoomOfferFieldsToWantedListings1770000000000 implements MigrationInterface {
  name = "AddRoomOfferFieldsToWantedListings1770000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wanted_listings" ADD COLUMN "address" character varying(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "wanted_listings" ADD COLUMN "contact_info" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "wanted_listings" ADD COLUMN "expires_at" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wanted_listings" DROP COLUMN "expires_at"`);
    await queryRunner.query(`ALTER TABLE "wanted_listings" DROP COLUMN "contact_info"`);
    await queryRunner.query(`ALTER TABLE "wanted_listings" DROP COLUMN "address"`);
  }
}
