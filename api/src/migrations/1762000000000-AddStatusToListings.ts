import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToListings1762000000000 implements MigrationInterface {
    name = 'AddStatusToListings1762000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."listings_status_enum" AS ENUM('active', 'draft', 'sold')`);
        await queryRunner.query(`ALTER TABLE "listings" ADD "status" "public"."listings_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`UPDATE "listings" SET "status" = CASE WHEN "is_active" = true THEN 'active' ELSE 'draft' END`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."listings_status_enum"`);
    }
}
