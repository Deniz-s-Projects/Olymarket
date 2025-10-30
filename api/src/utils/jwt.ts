import jwt from "jsonwebtoken";

export function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "changeme", {
    expiresIn: "7d",
  });
}
