import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { CommunityDiscussion } from "./CommunityDiscussion";
import { User } from "./User";

@Entity({ name: "community_comments" })
export class CommunityComment extends BaseModel {
  @Column({ type: "text" })
  body!: string;

  @ManyToOne(() => CommunityDiscussion, (discussion) => discussion.comments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "discussion_id" })
  discussion!: CommunityDiscussion;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;
}
