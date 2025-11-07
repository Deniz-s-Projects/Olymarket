import { Request, Response, NextFunction } from "express";
import { API_KEY, API_KEY_HEADER } from "../constants/security";

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const providedKey = req.headers[API_KEY_HEADER];
  const normalizedKey = Array.isArray(providedKey)
    ? providedKey[0]
    : providedKey;

  if (!API_KEY || !normalizedKey || normalizedKey !== API_KEY) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  return next();
}
