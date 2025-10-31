import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { Announcement } from "./Announcement";

@Entity({ name: "announcement_audiences" })
export class AnnouncementAudience extends BaseModel {
  @ManyToOne(() => Announcement, (announcement) => announcement.audiences, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "announcement_id" })
  announcement!: Announcement;

  @Column({ type: "varchar", length: 50 })
  type!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  value!: string | null;
}
