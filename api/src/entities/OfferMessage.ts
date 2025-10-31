import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Offer } from "./Offer";
import { User } from "./User";

export type OfferMessageType = "offer" | "counter" | "note" | "status";

@Entity({ name: "offer_messages" })
export class OfferMessage extends BaseModel {
  @Column({ type: "text", nullable: true })
  body!: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2, nullable: true })
  amount!: string | null;

  @Column({
    type: "enum",
    enum: ["offer", "counter", "note", "status"],
    default: "offer",
  })
  type!: OfferMessageType;

  @ManyToOne(() => Offer, (offer) => offer.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "offer_id" })
  offer!: Offer;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: "sender_id" })
  sender!: User | null;
}
