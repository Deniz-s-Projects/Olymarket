import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Listing } from "./Listing";
import { User } from "./User";

@Entity({ name: "listing_comments" })
export class ListingComment extends BaseModel {
  @Column({ type: "text" })
  body!: string;

  @ManyToOne(() => Listing, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: User;
}
