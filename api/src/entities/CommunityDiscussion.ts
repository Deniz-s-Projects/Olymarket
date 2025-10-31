import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { CommunityComment } from "./CommunityComment";

@Entity({ name: "community_discussions" })
export class CommunityDiscussion extends BaseModel {
  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;

  @OneToMany(() => CommunityComment, (comment) => comment.discussion)
  comments!: CommunityComment[];
}
