import { Entity, Column, OneToMany, Unique } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Listing } from "./Listing";

@Entity({ name: "listing_categories" })
@Unique(["slug"])
export class ListingCategory extends BaseModel {
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100 })
  slug!: string;

  @OneToMany(() => Listing, (listing) => listing.category)
  listings!: Listing[];
}
