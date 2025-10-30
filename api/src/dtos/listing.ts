import { IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from "class-validator";

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
}
