import { Entity, Column, OneToMany } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { ConversationParticipant } from "./ConversationParticipant";
import { Message } from "./Message";
import { Offer } from "./Offer";
import { WantedListing } from "./WantedListing";

@Entity({ name: "conversations" })
export class Conversation extends BaseModel {
  @Column({ length: 150 })
  topic!: string;

  @OneToMany(() => ConversationParticipant, (participant) => participant.conversation)
  participants!: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];

  @OneToMany(() => Offer, (offer) => offer.conversation)
  offers!: Offer[];

  @OneToMany(() => WantedListing, (wantedListing) => wantedListing.conversation)
  wantedRequests!: WantedListing[];
}
