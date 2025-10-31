import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToListings1763100000000 implements MigrationInterface {
    name = 'AddStatusToListings1763100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."listing_status_enum" AS ENUM('active', 'draft', 'sold')`);
        await queryRunner.query(`ALTER TABLE "listings" ADD "status" "public"."listing_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`UPDATE "listings" SET "status" = CASE WHEN "is_active" = true THEN 'active' ELSE 'draft' END`);
        await queryRunner.query(`UPDATE "listings" SET "is_active" = CASE WHEN "status" = 'active' THEN true ELSE false END`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."listing_status_enum"`);
    }
}
