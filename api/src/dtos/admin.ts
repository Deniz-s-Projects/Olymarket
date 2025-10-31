import { IsBoolean, IsIn, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";

export class AdminListingUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumberString()
  price?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(["active", "draft", "sold"])
  status?: "active" | "draft" | "sold";

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(["pending", "approved", "rejected"]) 
  moderationStatus?: "pending" | "approved" | "rejected";

  @IsOptional()
  @IsString()
  moderationNotes?: string;
}


