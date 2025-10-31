import { Entity, Column, OneToMany, Unique, OneToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Listing } from "./Listing";
import { ConversationParticipant } from "./ConversationParticipant";
import { Message } from "./Message";
import { SavedListing } from "./SavedListing";
import { GroupMember } from "./GroupMember";
import { UserPreference } from "./UserPreference";
import { WantedListing } from "./WantedListing";

@Entity({ name: "users" })
@Unique(["email"])
export class User extends BaseModel {
  @Column({ length: 255 })
  email!: string;

  @Column({ name: "password_hash", select: false })
  passwordHash!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  location!: string | null;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({
    type: "enum",
    enum: ["user", "admin"],
    default: "user",
  })
  role!: "user" | "admin";

  @Column({ name: "is_banned", type: "boolean", default: false })
  isBanned!: boolean;

  @Column({ name: "banned_at", type: "timestamp", nullable: true })
  bannedAt!: Date | null;

  @Column({ name: "ban_reason", type: "text", nullable: true })
  banReason!: string | null;

  @OneToMany(() => Listing, (listing) => listing.owner)
  listings!: Listing[];

  @OneToMany(() => ConversationParticipant, (participant) => participant.user)
  conversationParticipants!: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.sender)
  messages!: Message[];

  @OneToMany(() => SavedListing, (savedListing) => savedListing.user)
  savedListings!: SavedListing[];

  @OneToMany(() => GroupMember, (groupMember) => groupMember.user)
  groupMemberships!: GroupMember[];

  @OneToOne(() => UserPreference, (preference) => preference.user)
  preference?: UserPreference | null;

  @OneToMany(() => WantedListing, (wantedListing) => wantedListing.buyer)
  wantedListings!: WantedListing[];

  @OneToMany(() => WantedListing, (wantedListing) => wantedListing.fulfillingSeller)
  fulfilledWantedRequests!: WantedListing[];
}
