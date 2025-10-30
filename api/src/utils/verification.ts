const DEFAULT_LENGTH = 6;
const DIGITS = "0123456789";

export function generateVerificationCode(length = DEFAULT_LENGTH): string {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * DIGITS.length);
    code += DIGITS[randomIndex];
  }
  return code;
}

export function verificationCodeExpiresAt(minutesFromNow: number): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + minutesFromNow);
  return expiresAt;
}
