import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { User } from "./User";

@Entity({ name: "user_hydration_entries" })
export class UserHydrationEntry extends BaseModel {
  @Index("IDX_user_hydration_entries_user_id")
  @ManyToOne(() => User, (user) => user.hydrationEntries, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Index("IDX_user_hydration_entries_recorded_at")
  @Column({ name: "recorded_at", type: "timestamp", default: () => "now()" })
  recordedAt!: Date;

  @Column({ name: "amount_ml", type: "integer" })
  amountMl!: number;
}
