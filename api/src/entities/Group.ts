import { Entity, Column, ManyToOne, OneToMany } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { GroupMember } from "./GroupMember";

@Entity({ name: "groups" })
export class Group extends BaseModel {
  @Column({ length: 150 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: ["hobby", "interest", "block"],
    default: "interest",
  })
  type!: "hobby" | "interest" | "block";

  @ManyToOne(() => User, { nullable: false })
  owner!: User;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany(() => GroupMember, (member) => member.group)
  members!: GroupMember[];
}
