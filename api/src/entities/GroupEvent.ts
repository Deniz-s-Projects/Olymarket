import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Group } from "./Group";
import { User } from "./User";
import { GroupEventRsvp } from "./GroupEventRsvp";
import { GroupPost } from "./GroupPost";

@Entity({ name: "group_events" })
export class GroupEvent extends BaseModel {
  @Column({ length: 150 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "timestamptz", name: "start_at" })
  startAt!: Date;

  @Column({ type: "timestamptz", name: "end_at", nullable: true })
  endAt!: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  location!: string | null;

  @Column({ name: "is_all_day", type: "boolean", default: false })
  isAllDay!: boolean;

  @Column({ name: "rsvp_deadline", type: "timestamptz", nullable: true })
  rsvpDeadline!: Date | null;

  @ManyToOne(() => Group, (group) => group.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_id" })
  creator!: User;

  @OneToMany(() => GroupEventRsvp, (rsvp) => rsvp.event)
  rsvps!: GroupEventRsvp[];

  @OneToMany(() => GroupPost, (post) => post.event)
  posts!: GroupPost[];
}
