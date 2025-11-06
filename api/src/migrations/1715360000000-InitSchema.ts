import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1715360000000 implements MigrationInterface {
  name = "InitSchema1715360000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar NOT NULL,
        "name" varchar(150) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "listing_categories" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL UNIQUE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "listings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(150) NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "show_contact_info" boolean NOT NULL DEFAULT true,
        "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "category_id" uuid NULL REFERENCES "listing_categories"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "topic" varchar(150) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversation_participants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "last_read_at" TIMESTAMP NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT conversation_participant_unique UNIQUE ("conversation_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "body" text NOT NULL,
        "conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversation_participants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "listings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "listing_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
