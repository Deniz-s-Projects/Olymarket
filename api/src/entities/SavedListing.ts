import { Entity, ManyToOne, JoinColumn, Unique } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { Listing } from "./Listing";

@Entity({ name: "saved_listings" })
@Unique(["user", "listing"])
export class SavedListing extends BaseModel {
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Listing)
  @JoinColumn({ name: "listing_id" })
  listing!: Listing;
}
