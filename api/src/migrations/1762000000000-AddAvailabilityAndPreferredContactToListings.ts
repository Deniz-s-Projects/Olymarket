import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvailabilityAndPreferredContactToListings1762000000000 implements MigrationInterface {
    name = 'AddAvailabilityAndPreferredContactToListings1762000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" ADD "availability" text`);
        await queryRunner.query(`ALTER TABLE "listings" ADD "preferred_contact_method" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "preferred_contact_method"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "availability"`);
    }
}
