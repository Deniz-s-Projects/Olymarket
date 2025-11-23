import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

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

  @IsOptional()
  @IsString()
  adminNotice?: string;

  @IsOptional()
  @IsIn(["info", "warning", "danger"])
  adminNoticeSeverity?: "info" | "warning" | "danger";
}

export class AdminCreateUserDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  name!: string;

  @Matches(/^[+][0-9]{5,15}$/)
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsIn(["user", "admin"])
  role?: "user" | "admin";
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Matches(/^[+][0-9]{5,15}$/)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsIn(["user", "admin"])
  role?: "user" | "admin";
}


