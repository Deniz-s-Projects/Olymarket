import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";
import { ListingCategory } from "./ListingCategory";

@Entity({ name: "listings" })
export class Listing extends BaseModel {
  @Column({ length: 150 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  price!: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @ManyToOne(() => User, (user) => user.listings, { eager: true })
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @ManyToOne(() => ListingCategory, (category) => category.listings, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: "category_id" })
  category!: ListingCategory | null;
}
