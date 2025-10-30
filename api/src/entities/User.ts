import { Entity, Column, OneToMany, Unique } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Listing } from "./Listing";
import { ConversationParticipant } from "./ConversationParticipant";
import { Message } from "./Message";

@Entity({ name: "users" })
@Unique(["email"])
export class User extends BaseModel {
  @Column({ length: 255 })
  email!: string;

  @Column({ name: "password_hash" })
  passwordHash!: string;

  @Column({ length: 150 })
  name!: string;

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings!: Listing[];

  @OneToMany(() => ConversationParticipant, (participant) => participant.user)
  conversationParticipants!: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.sender)
  messages!: Message[];
}
