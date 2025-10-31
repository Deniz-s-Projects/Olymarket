import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { Listing } from "./Listing";

@Entity({ name: "reports" })
export class Report extends BaseModel {
  @Column({
    type: "enum",
    enum: ["listing", "user"],
    name: "report_type"
  })
  reportType!: "listing" | "user";

  @Column({ type: "text" })
  reason!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: ["pending", "under_review", "resolved", "dismissed"],
    default: "pending",
  })
  status!: "pending" | "under_review" | "resolved" | "dismissed";

  @Column({ name: "resolution_notes", type: "text", nullable: true })
  resolutionNotes!: string | null;

  @Column({ name: "resolved_at", type: "timestamp", nullable: true })
  resolvedAt!: Date | null;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "reporter_id" })
  reporter!: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: "reported_user_id" })
  reportedUser!: User | null;

  @ManyToOne(() => Listing, { nullable: true, eager: true })
  @JoinColumn({ name: "reported_listing_id" })
  reportedListing!: Listing | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: "reviewed_by_id" })
  reviewedBy!: User | null;
}
