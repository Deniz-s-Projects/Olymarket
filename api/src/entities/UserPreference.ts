import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";

@Entity({ name: "user_preferences" })
export class UserPreference extends BaseModel {
  @OneToOne(() => User, (user) => user.preference, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "marketplace_alerts", type: "boolean", default: false })
  marketplaceAlerts!: boolean;

  @Column({ name: "saved_search_digests", type: "boolean", default: false })
  savedSearchDigests!: boolean;

  @Column({ name: "community_news", type: "boolean", default: false })
  communityNews!: boolean;
}
