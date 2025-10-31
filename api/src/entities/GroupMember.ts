import { Entity, ManyToOne, Column, JoinColumn } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { Group } from "./Group";

@Entity({ name: "group_members" })
export class GroupMember extends BaseModel {
  @ManyToOne(() => Group, (group) => group.members, { onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({
    type: "enum",
    enum: ["member", "moderator"],
    default: "member",
  })
  role!: "member" | "moderator";

  @Column({ name: "joined_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  joinedAt!: Date;
}
