import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Group } from "./Group";
import { User } from "./User";
import { GroupEvent } from "./GroupEvent";
import { GroupComment } from "./GroupComment";

@Entity({ name: "group_posts" })
export class GroupPost extends BaseModel {
  @Column({ length: 150, nullable: true })
  title!: string | null;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "is_pinned", type: "boolean", default: false })
  isPinned!: boolean;

  @Column({ name: "is_archived", type: "boolean", default: false })
  isArchived!: boolean;

  @ManyToOne(() => Group, (group) => group.posts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "group_id" })
  group!: Group;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;

  @ManyToOne(() => GroupEvent, (event) => event.posts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "event_id" })
  event!: GroupEvent | null;

  @OneToMany(() => GroupComment, (comment) => comment.post)
  comments!: GroupComment[];
}
