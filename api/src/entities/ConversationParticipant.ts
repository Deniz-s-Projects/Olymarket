import { Entity, ManyToOne, JoinColumn, Unique, Column } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Conversation } from "./Conversation";
import { User } from "./User";

@Entity({ name: "conversation_participants" })
@Unique(["conversation", "user"])
export class ConversationParticipant extends BaseModel {
  @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversation_id" })
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.conversationParticipants, {
    eager: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "last_read_at", type: "timestamp", nullable: true })
  lastReadAt!: Date | null;
}
