import { Router } from "express";
import { validationMiddleware } from "../middleware/validate";
import { RegisterDto, LoginDto } from "../dtos/auth";
import { AppDataSource } from "../config";
import { User } from "../entities/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.post("/register", validationMiddleware(RegisterDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email: req.body.email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await hashPassword(req.body.password);
  const user = userRepository.create({
    email: req.body.email,
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    passwordHash,
  });
  await userRepository.save(user);

  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isBanned: user.isBanned,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
    },
    token: signToken(user.id),
  });
});

router.post("/login", validationMiddleware(LoginDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository
    .createQueryBuilder("user")
    .addSelect("user.passwordHash")
    .where("user.email = :email", { email: req.body.email })
    .getOne();
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await comparePassword(req.body.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.isBanned) {
    return res.status(403).json({ message: "Account is banned" });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isBanned: user.isBanned,
      bannedAt: user.bannedAt,
      banReason: user.banReason,
    },
    token: signToken(user.id),
  });
});

router.get("/me", authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      phoneNumber: req.user.phoneNumber,
      role: req.user.role,
      isBanned: req.user.isBanned,
      bannedAt: req.user.bannedAt,
      banReason: req.user.banReason,
    },
  });
});

/**
 * Fetch only contact fields for a user by id.
 * Returns { id, email, phoneNumber } with nulls when missing.
 */
export async function fetchUserContactById(
  id: string
): Promise<{ id: string; email: string | null; phoneNumber: string | null }> {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({
    where: { id },
    select: ["id", "email", "phoneNumber"],
  });
  return {
    id: user?.id ?? id,
    email: user?.email ?? null,
    phoneNumber: user?.phoneNumber ?? null,
  };
}

export default router;
