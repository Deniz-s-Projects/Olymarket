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
    passwordHash,
  });
  await userRepository.save(user);

  return res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
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

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
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
    },
  });
});

export default router;
