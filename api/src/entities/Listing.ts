import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { ListingCategory } from "./ListingCategory";
import { Offer } from "./Offer";
import { ListingComment } from "./ListingComment";

@Entity({ name: "listings" })
export class Listing extends BaseModel {
  @Column({ length: 150 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price!: string;

  @Column({ name: "is_free", default: false })
  isFree!: boolean;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({
    type: "enum",
    enum: ["active", "draft", "sold", "expired"],
    default: "active",
  })
  status!: "active" | "draft" | "sold" | "expired";

  @Column({ type: "text", array: true, nullable: true, default: () => "ARRAY[]::text[]" })
  images!: string[] | null;

  @Column({ type: "text", nullable: true })
  availability!: string | null;

  @Column({ name: "preferred_contact_method", type: "text", nullable: true })
  preferredContactMethod!: string | null;

  @Column({ name: "show_contact_info", type: "boolean", default: false })
  showContactInfo!: boolean;

  @Column({
    type: "enum",
    enum: ["new", "good", "used_but_works", "fixer_upper"],
    default: "used_but_works",
  })
  condition!: "new" | "good" | "used_but_works" | "fixer_upper";

  @Column({
    name: "moderation_status",
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  })
  moderationStatus!: "pending" | "approved" | "rejected";

  @Column({ name: "moderation_notes", type: "text", nullable: true })
  moderationNotes!: string | null;

  @Column({ name: "admin_notice", type: "text", nullable: true })
  adminNotice!: string | null;

  @Column({
    name: "admin_notice_severity",
    type: "enum",
    enum: ["info", "warning", "danger"],
    default: "info",
  })
  adminNoticeSeverity!: "info" | "warning" | "danger";

  @Column({ name: "reviewed_at", type: "timestamp", nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: "views_count", type: "integer", default: 0 })
  viewsCount!: number;

  @Column({ name: "saves_count", type: "integer", default: 0 })
  savesCount!: number;

  @Column({ name: "sold_at", type: "timestamp", nullable: true })
  soldAt!: Date | null;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt!: Date;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: "reviewer_id" })
  reviewer!: User | null;

  @ManyToOne(() => User, (user) => user.listings, { eager: true })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @ManyToOne(() => ListingCategory, (category) => category.listings, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: "category_id" })
  category!: ListingCategory | null;

  @OneToMany(() => Offer, (offer) => offer.listing)
  offers!: Offer[];

  @OneToMany(() => ListingComment, (comment) => comment.listing)
  comments!: ListingComment[];
}
