import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Conversation } from "./Conversation";
import { User } from "./User";

@Entity({ name: "messages" })
export class Message extends BaseModel {
  @Column({ type: "text" })
  body!: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversation_id" })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.messages, { eager: true })
  @JoinColumn({ name: "sender_id" })
  sender!: User;
}
