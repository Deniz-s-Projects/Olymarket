import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { GroupPost } from "./GroupPost";
import { User } from "./User";

@Entity({ name: "group_comments" })
export class GroupComment extends BaseModel {
  @Column({ type: "text" })
  body!: string;

  @ManyToOne(() => GroupPost, (post) => post.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post!: GroupPost;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;
}
