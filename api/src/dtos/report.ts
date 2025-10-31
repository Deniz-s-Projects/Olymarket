import { IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from "class-validator";

export class ReportDto {
  @IsIn(["listing", "user"])
  reportType!: "listing" | "user";

  @IsString()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateIf((o) => o.reportType === "listing")
  @IsUUID()
  reportedListingId?: string;

  @ValidateIf((o) => o.reportType === "user")
  @IsUUID()
  reportedUserId?: string;
}

export class AdminReportUpdateDto {
  @IsOptional()
  @IsIn(["pending", "under_review", "resolved", "dismissed"])
  status?: "pending" | "under_review" | "resolved" | "dismissed";

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
