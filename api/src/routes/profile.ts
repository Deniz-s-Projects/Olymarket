import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { UpsertProfileDto } from "../dtos/profile";
import { User } from "../entities/User";
import { UserProfile } from "../entities/UserProfile";

const router = Router();

const serializeProfile = (user: User, profile: UserProfile | null) => ({
  name: user.name,
  email: user.email,
  location: profile?.location ?? null,
  bio: profile?.bio ?? null,
  notifyNewListings: profile?.notifyNewListings ?? true,
  memberSince: user.createdAt.toISOString(),
  updatedAt: (profile?.updatedAt ?? user.updatedAt).toISOString(),
});

router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({
    where: { id: req.user.id },
    relations: { profile: true },
  });

  if (!user) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (!user.profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  return res.json({ profile: serializeProfile(user, user.profile) });
});

router.put(
  "/",
  authMiddleware,
  validationMiddleware(UpsertProfileDto),
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const profileRepository = AppDataSource.getRepository(UserProfile);

    const user = await userRepository.findOne({
      where: { id: req.user.id },
      relations: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    user.name = req.body.name;

    const nextLocation = req.body.location?.trim() ?? "";
    const nextBio = req.body.bio?.trim() ?? "";

    let profile = user.profile ?? profileRepository.create({ user });
    profile.location = nextLocation.length > 0 ? nextLocation : null;
    profile.bio = nextBio.length > 0 ? nextBio : null;
    if (typeof req.body.notifyNewListings !== "undefined") {
      profile.notifyNewListings = req.body.notifyNewListings;
    }

    await userRepository.save(user);
    profile = await profileRepository.save(profile);

    return res.json({
      profile: serializeProfile(user, profile),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
    });
  }
);

export default router;
