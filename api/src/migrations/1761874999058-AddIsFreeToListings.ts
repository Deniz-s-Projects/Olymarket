import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsFreeToListings1761874999058 implements MigrationInterface {
    name = 'AddIsFreeToListings1761874999058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "listings_owner_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "listings_category_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "listings_reviewer_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_conversation_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" DROP CONSTRAINT "saved_listings_user_id_fkey"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" DROP CONSTRAINT "saved_listings_listing_id_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."idx_saved_listings_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_saved_listings_listing_id"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participant_unique"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" DROP CONSTRAINT "UQ_saved_listing_user_listing"`);
        await queryRunner.query(`ALTER TABLE "listings" ADD "is_free" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "images" SET DEFAULT ARRAY[]::text[]`);
        await queryRunner.query(`ALTER TYPE "public"."listing_moderation_enum" RENAME TO "listing_moderation_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."listings_moderation_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "moderation_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "moderation_status" TYPE "public"."listings_moderation_status_enum" USING "moderation_status"::"text"::"public"."listings_moderation_status_enum"`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "moderation_status" SET DEFAULT 'approved'`);
        await queryRunner.query(`DROP TYPE "public"."listing_moderation_enum_old"`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "conversation_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ALTER COLUMN "conversation_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ALTER COLUMN "listing_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "UQ_fdcd6405d74e797f10fa8360338" UNIQUE ("conversation_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ADD CONSTRAINT "UQ_424fc7d2f20ec2503690f0316e6" UNIQUE ("user_id", "listing_id")`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "FK_30e0c9f1fd382336aadb53d2b67" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "FK_9f5b6113628f91bcf8a8e2dfa3c" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "FK_9315deed3e8f6d9171c23131418" FOREIGN KEY ("category_id") REFERENCES "listing_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_1559e8a16b828f2e836a2312800" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_377d4041a495b81ee1a85ae026f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_c254fef47020a5109201fe0ebf0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ADD CONSTRAINT "FK_d5a474776e90e4df0c516dcba05" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_d5a474776e90e4df0c516dcba05"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" DROP CONSTRAINT "FK_c254fef47020a5109201fe0ebf0"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_377d4041a495b81ee1a85ae026f"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_1559e8a16b828f2e836a2312800"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_9315deed3e8f6d9171c23131418"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_9f5b6113628f91bcf8a8e2dfa3c"`);
        await queryRunner.query(`ALTER TABLE "listings" DROP CONSTRAINT "FK_30e0c9f1fd382336aadb53d2b67"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" DROP CONSTRAINT "UQ_424fc7d2f20ec2503690f0316e6"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "UQ_fdcd6405d74e797f10fa8360338"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum_old" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_enum_old" USING "role"::"text"::"public"."user_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum_old" RENAME TO "user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ALTER COLUMN "listing_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ALTER COLUMN "conversation_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "sender_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."listing_moderation_enum_old" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "moderation_status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "moderation_status" TYPE "public"."listing_moderation_enum_old" USING "moderation_status"::"text"::"public"."listing_moderation_enum_old"`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "moderation_status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."listings_moderation_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."listing_moderation_enum_old" RENAME TO "listing_moderation_enum"`);
        await queryRunner.query(`ALTER TABLE "listings" ALTER COLUMN "images" SET DEFAULT ARRAY[]`);
        await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN "is_free"`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ADD CONSTRAINT "UQ_saved_listing_user_listing" UNIQUE ("user_id", "listing_id")`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participant_unique" UNIQUE ("conversation_id", "user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_saved_listings_listing_id" ON "saved_listings" ("listing_id") `);
        await queryRunner.query(`CREATE INDEX "idx_saved_listings_user_id" ON "saved_listings" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "listings_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "listing_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
