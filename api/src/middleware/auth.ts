import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config";
import { User } from "../entities/User";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authMiddleware: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "changeme") as {
      userId: string;
    };

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: payload.userId } });
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
