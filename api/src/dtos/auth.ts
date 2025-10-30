import { IsEmail, IsNotEmpty, Length, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;

  @IsNotEmpty()
  name!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  password!: string;
}

export class VerifyEmailDto {
  @IsEmail()
  email!: string;

  @Length(6, 6)
  @Matches(/^\d+$/, { message: "Verification code must be numeric" })
  code!: string;
}
