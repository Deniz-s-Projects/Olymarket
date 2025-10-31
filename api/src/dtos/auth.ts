import { IsEmail, IsNotEmpty, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  @Matches(/^\+[0-9]{5,15}$/, {
    message: "Phone number must include a leading + and 5-15 digits.",
  })
  phoneNumber!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;
}
