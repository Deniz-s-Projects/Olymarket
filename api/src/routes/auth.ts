import { Router } from "express";
import { validationMiddleware } from "../middleware/validate";
import { RegisterDto, LoginDto, VerifyEmailDto } from "../dtos/auth";
import { AppDataSource } from "../config";
import { User } from "../entities/User";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { generateVerificationCode, verificationCodeExpiresAt } from "../utils/verification";
import { sendVerificationEmail } from "../utils/email";

const VERIFICATION_CODE_TTL_MINUTES = 60;

const router = Router();

router.post("/register", validationMiddleware(RegisterDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { email: req.body.email } });
  if (existing) {
    if (existing.isVerified) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const verificationCode = generateVerificationCode();
    existing.name = req.body.name;
    existing.passwordHash = await hashPassword(req.body.password);
    existing.verificationCodeHash = await hashPassword(verificationCode);
    existing.verificationCodeExpiresAt = verificationCodeExpiresAt(VERIFICATION_CODE_TTL_MINUTES);
    await userRepository.save(existing);

    await sendVerificationEmail(existing.email, verificationCode);

    return res.json({
      message: "A new verification code has been sent to your email",
    });
  }

  const passwordHash = await hashPassword(req.body.password);
  const verificationCode = generateVerificationCode();
  const user = userRepository.create({
    email: req.body.email,
    name: req.body.name,
    passwordHash,
    isVerified: false,
    verificationCodeHash: await hashPassword(verificationCode),
    verificationCodeExpiresAt: verificationCodeExpiresAt(VERIFICATION_CODE_TTL_MINUTES),
  });
  await userRepository.save(user);

  await sendVerificationEmail(user.email, verificationCode);

  return res.status(201).json({
    message: "Verification code sent to your email",
  });
});

router.post("/login", validationMiddleware(LoginDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email: req.body.email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await comparePassword(req.body.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: "Please verify your email before signing in" });
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
    },
    token: signToken(user.id),
  });
});

router.post("/verify", validationMiddleware(VerifyEmailDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { email: req.body.email } });
  if (!user) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (user.isVerified) {
    return res.status(409).json({ message: "This account is already verified" });
  }

  if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
    return res.status(400).json({ message: "No verification code is set for this account" });
  }

  const now = new Date();
  if (user.verificationCodeExpiresAt.getTime() < now.getTime()) {
    return res.status(400).json({ message: "The verification code has expired" });
  }

  const codeMatches = await comparePassword(req.body.code, user.verificationCodeHash);
  if (!codeMatches) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  user.isVerified = true;
  user.verificationCodeHash = null;
  user.verificationCodeExpiresAt = null;
  await userRepository.save(user);

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
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
      isVerified: req.user.isVerified,
    },
  });
});

export default router;
