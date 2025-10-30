import { Entity, Column, OneToMany, Unique, OneToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Listing } from "./Listing";
import { ConversationParticipant } from "./ConversationParticipant";
import { Message } from "./Message";
import { UserProfile } from "./UserProfile";

@Entity({ name: "users" })
@Unique(["email"])
export class User extends BaseModel {
  @Column({ length: 255 })
  email!: string;

  @Column({ name: "password_hash", select: false })
  passwordHash!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ name: "is_verified", default: false })
  isVerified!: boolean;

  @Column({ name: "verification_code_hash", type: "varchar", nullable: true })
  verificationCodeHash!: string | null;

  @Column({
    name: "verification_code_expires_at",
    type: "timestamp",
    nullable: true,
  })
  verificationCodeExpiresAt!: Date | null;

  @OneToOne(() => UserProfile, (profile) => profile.user, {
    cascade: true,
  })
  profile?: UserProfile | null;

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings!: Listing[];

  @OneToMany(() => ConversationParticipant, (participant) => participant.user)
  conversationParticipants!: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.sender)
  messages!: Message[];
}
