import { ArrayMaxSize, IsArray, IsBoolean, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength, IsIn } from "class-validator";

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
  isFree?: boolean;

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
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  images?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  availability!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  preferredContactMethod!: string;

  @IsOptional()
  @IsString()
  @IsIn(["new", "good", "used_but_works", "fixer_upper"])
  condition?: "new" | "good" | "used_but_works" | "fixer_upper";
}
