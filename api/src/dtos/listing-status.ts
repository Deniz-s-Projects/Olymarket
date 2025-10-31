import { IsIn } from "class-validator";

export class ListingStatusDto {
  @IsIn(["active", "draft", "sold"])
  status!: "active" | "draft" | "sold";
}
