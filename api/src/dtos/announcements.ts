import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class AnnouncementAudienceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  value?: string | null;
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsDateString()
  publishFrom!: string;

  @IsDateString()
  @IsOptional()
  publishTo?: string | null;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAudienceDto)
  @ArrayMaxSize(20)
  @IsOptional()
  audiences?: AnnouncementAudienceDto[];
}

export class UpdateAnnouncementDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsDateString()
  @IsOptional()
  publishFrom?: string;

  @IsDateString()
  @IsOptional()
  publishTo?: string | null;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAudienceDto)
  @ArrayMaxSize(20)
  @IsOptional()
  audiences?: AnnouncementAudienceDto[];
}
