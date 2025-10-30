import { Router } from "express";
import { AppDataSource } from "../config";
import { User } from "../entities/User";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/account", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    name: user.name,
    email: user.email,
    memberSince: user.createdAt.toISOString(),
    location: user.location ?? undefined,
    bio: user.bio ?? undefined,
  });
});

router.patch("/account", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: req.user!.id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (typeof req.body.name === "string") {
    const trimmed = req.body.name.trim();
    if (trimmed.length > 0) user.name = trimmed;
  }
  if (typeof req.body.location === "string") {
    const trimmed = req.body.location.trim();
    user.location = trimmed.length > 0 ? trimmed : null;
  }
  if (typeof req.body.bio === "string") {
    const trimmed = req.body.bio.trim();
    user.bio = trimmed.length > 0 ? trimmed : null;
  }

  const saved = await userRepository.save(user);
  return res.json({
    name: saved.name,
    email: saved.email,
    memberSince: saved.createdAt.toISOString(),
    location: saved.location ?? undefined,
    bio: saved.bio ?? undefined,
  });
});

export default router;


