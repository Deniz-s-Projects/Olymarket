import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCommunityDiscussionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class CreateCommunityCommentDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
