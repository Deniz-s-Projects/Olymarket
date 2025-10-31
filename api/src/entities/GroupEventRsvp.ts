import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { GroupEvent } from "./GroupEvent";
import { User } from "./User";

export type GroupEventRsvpStatus = "going" | "maybe" | "not_going";

@Entity({ name: "group_event_rsvps" })
@Unique(["event", "user"])
export class GroupEventRsvp extends BaseModel {
  @ManyToOne(() => GroupEvent, (event) => event.rsvps, { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: GroupEvent;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({
    type: "enum",
    enum: ["going", "maybe", "not_going"],
    default: "going",
  })
  status!: GroupEventRsvpStatus;

  @Column({ name: "reminder_sent_at", type: "timestamptz", nullable: true })
  reminderSentAt!: Date | null;
}
