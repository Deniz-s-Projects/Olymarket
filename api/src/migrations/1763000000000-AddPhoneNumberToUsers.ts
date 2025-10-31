import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneNumberToUsers1763000000000 implements MigrationInterface {
  name = "AddPhoneNumberToUsers1763000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" character varying(32)'
    );

    await queryRunner.query(
      "UPDATE \"users\" SET \"phone_number\" = '+12065550100' WHERE \"phone_number\" IS NULL"
    );

    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "phone_number" SET NOT NULL'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_number"');
  }
}
