import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOffers1762000000000 implements MigrationInterface {
    name = "AddOffers1762000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."offers_status_enum" AS ENUM('pending', 'accepted', 'declined')`);
        await queryRunner.query(`CREATE TYPE "public"."offer_messages_type_enum" AS ENUM('offer', 'counter', 'note', 'status')`);
        await queryRunner.query(`CREATE TABLE "offers" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "amount" numeric(10,2) NOT NULL,
            "status" "public"."offers_status_enum" NOT NULL DEFAULT 'pending',
            "listing_id" uuid NOT NULL,
            "buyer_id" uuid NOT NULL,
            "seller_id" uuid NOT NULL,
            "last_action_by_id" uuid,
            "conversation_id" uuid,
            CONSTRAINT "PK_offers_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_offers_listing_id" ON "offers" ("listing_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_offers_buyer_id" ON "offers" ("buyer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_offers_seller_id" ON "offers" ("seller_id")`);
        await queryRunner.query(`CREATE TABLE "offer_messages" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "body" text,
            "amount" numeric(10,2),
            "type" "public"."offer_messages_type_enum" NOT NULL DEFAULT 'offer',
            "offer_id" uuid NOT NULL,
            "sender_id" uuid,
            CONSTRAINT "PK_offer_messages_id" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_offer_messages_offer_id" ON "offer_messages" ("offer_id")`);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_listing" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_buyer" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_seller" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_last_action" FOREIGN KEY ("last_action_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_offers_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offer_messages" ADD CONSTRAINT "FK_offer_messages_offer" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "offer_messages" ADD CONSTRAINT "FK_offer_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offer_messages" DROP CONSTRAINT "FK_offer_messages_sender"`);
        await queryRunner.query(`ALTER TABLE "offer_messages" DROP CONSTRAINT "FK_offer_messages_offer"`);
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_conversation"`);
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_last_action"`);
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_seller"`);
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_buyer"`);
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_offers_listing"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_offer_messages_offer_id"`);
        await queryRunner.query(`DROP TABLE "offer_messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_offers_seller_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_offers_buyer_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_offers_listing_id"`);
        await queryRunner.query(`DROP TABLE "offers"`);
        await queryRunner.query(`DROP TYPE "public"."offer_messages_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."offers_status_enum"`);
    }
}
