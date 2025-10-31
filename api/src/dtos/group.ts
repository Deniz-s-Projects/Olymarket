import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsUUID,
} from "class-validator";

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(["hobby", "interest", "block"])
  type!: "hobby" | "interest" | "block";
}

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(["hobby", "interest", "block"])
  @IsOptional()
  type?: "hobby" | "interest" | "block";
}

export class JoinGroupDto {
  // No additional fields needed - user ID comes from auth
}

export class CreateGroupEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsDateString()
  @IsOptional()
  rsvpDeadline?: string;
}

export class UpdateGroupEventDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @IsDateString()
  @IsOptional()
  rsvpDeadline?: string;
}

export class UpsertGroupEventRsvpDto {
  @IsEnum(["going", "maybe", "not_going"])
  status!: "going" | "maybe" | "not_going";
}

export class CreateGroupPostDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsUUID()
  @IsOptional()
  eventId?: string | null;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class UpdateGroupPostDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsUUID()
  @IsOptional()
  eventId?: string | null;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class CreateGroupCommentDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
