import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { ListingCategory } from "./ListingCategory";
import { Conversation } from "./Conversation";

export type WantedListingStatus = "open" | "matched" | "fulfilled" | "cancelled";

@Entity({ name: "wanted_listings" })
export class WantedListing extends BaseModel {
  @Column({ length: 150 })
  title!: string;

  @Column({ type: "text", nullable: true })
  details!: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  budget!: string;

  @Column({
    type: "enum",
    enum: ["open", "matched", "fulfilled", "cancelled"],
    default: "open",
  })
  status!: WantedListingStatus;

  @ManyToOne(() => User, (user) => user.wantedListings, { eager: true })
  @JoinColumn({ name: "buyer_id" })
  buyer!: User;

  @ManyToOne(() => ListingCategory, (category) => category.wantedRequests, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: "category_id" })
  category!: ListingCategory | null;

  @ManyToOne(() => User, (user) => user.fulfilledWantedRequests, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: "fulfilling_seller_id" })
  fulfillingSeller!: User | null;

  @Column({ name: "fulfilled_at", type: "timestamp", nullable: true })
  fulfilledAt!: Date | null;

  @ManyToOne(() => Conversation, (conversation) => conversation.wantedRequests, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: "conversation_id" })
  conversation!: Conversation | null;
}
