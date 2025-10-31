import { Column, Entity, OneToMany } from "typeorm";
import { BaseModel } from "./BaseEntity";
import { AnnouncementAudience } from "./AnnouncementAudience";

@Entity({ name: "announcements" })
export class Announcement extends BaseModel {
  @Column({ type: "varchar", length: 150 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "publish_from", type: "timestamptz" })
  publishFrom!: Date;

  @Column({ name: "publish_to", type: "timestamptz", nullable: true })
  publishTo!: Date | null;

  @Column({ name: "is_pinned", type: "boolean", default: false })
  isPinned!: boolean;

  @OneToMany(() => AnnouncementAudience, (audience) => audience.announcement, {
    cascade: true,
    eager: false,
  })
  audiences!: AnnouncementAudience[];
}
