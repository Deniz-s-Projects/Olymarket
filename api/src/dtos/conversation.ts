import { ArrayNotEmpty, IsArray, IsOptional, IsString, MaxLength } from "class-validator";

export class ConversationDto {
  @IsString()
  @MaxLength(150)
  topic!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  participantIds!: string[];
}

export class ConversationMessageDto {
  @IsString()
  body!: string;
}
