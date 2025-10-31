import {
  IsBoolean,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { WantedListingStatus } from "../entities/WantedListing";

export const WANTED_LISTING_STATUSES: WantedListingStatus[] = [
  "open",
  "matched",
  "fulfilled",
  "cancelled",
];

export class WantedListingCreateDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @IsNumberString()
  budget!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class WantedListingUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @IsOptional()
  @IsNumberString()
  budget?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(WANTED_LISTING_STATUSES)
  status?: WantedListingStatus;
}

export class WantedListingRespondDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsBoolean()
  markFulfilled?: boolean;
}
