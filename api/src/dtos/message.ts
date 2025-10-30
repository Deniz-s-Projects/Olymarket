import { IsNotEmpty, IsString } from "class-validator";

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  body!: string;
}
