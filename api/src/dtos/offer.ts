import { IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";

export class OfferCreateDto {
  @IsUUID()
  listingId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class OfferCounterDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
