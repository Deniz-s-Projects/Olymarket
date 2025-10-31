import { IsString, IsEnum, IsOptional, MaxLength, IsNotEmpty } from "class-validator";

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
