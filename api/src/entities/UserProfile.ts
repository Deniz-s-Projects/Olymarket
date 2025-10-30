import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";

@Entity({ name: "user_profiles" })
export class UserProfile extends BaseModel {
  @Column({ length: 150, nullable: true })
  location!: string | null;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({ name: "notify_new_listings", default: true })
  notifyNewListings!: boolean;

  @OneToOne(() => User, (user) => user.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
