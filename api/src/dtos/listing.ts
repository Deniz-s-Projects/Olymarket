import { IsArray, IsBoolean, IsNumberString, IsOptional, IsString, MaxLength, ArrayMaxSize, ValidateNested } from "class-validator";

export class ListingDto {
  @IsString()
  @MaxLength(150)
  title!: string;

  @IsString()
  description!: string;

  @IsNumberString()
  price!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  images?: string[];
}
