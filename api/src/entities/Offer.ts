import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Listing } from "./Listing";
import { User } from "./User";
import { OfferMessage } from "./OfferMessage";
import { Conversation } from "./Conversation";

export type OfferStatus = "pending" | "accepted" | "declined";

@Entity({ name: "offers" })
export class Offer extends BaseModel {
  @Column({ type: "numeric", precision: 10, scale: 2 })
  amount!: string;

  @Column({
    type: "enum",
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  })
  status!: OfferStatus;

  @ManyToOne(() => Listing, (listing) => listing.offers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;

  @ManyToOne(() => User, (user) => user.offersMade, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer!: User;

  @ManyToOne(() => User, (user) => user.offersReceived, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "seller_id" })
  seller!: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: "last_action_by_id" })
  lastActionBy!: User | null;

  @ManyToOne(() => Conversation, { nullable: true, eager: true })
  @JoinColumn({ name: "conversation_id" })
  conversation!: Conversation | null;

  @OneToMany(() => OfferMessage, (message) => message.offer)
  messages!: OfferMessage[];
}
