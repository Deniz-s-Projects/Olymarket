import { Router } from "express";
import { AppDataSource } from "../config";
import { User } from "../entities/User";
import { Listing } from "../entities/Listing";
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

router.get("/listings", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listings = await listingRepository.find({
    where: { owner: { id: req.user!.id } },
    order: { createdAt: "DESC" },
  });

  const activeListings = listings.filter((l) => l.isActive && l.moderationStatus === "approved");
  const inactiveListings = listings.filter((l) => !l.isActive || l.moderationStatus !== "approved");

  const mapListing = (listing: Listing) => ({
    id: listing.id,
    title: listing.title,
    category: listing.category?.name || "Uncategorized",
    price: parseFloat(listing.price),
    currency: "EUR",
    status: listing.isActive && listing.moderationStatus === "approved" ? "active" : "draft",
    updatedAt: listing.updatedAt.toISOString(),
    thumbnailUrl: listing.images && listing.images.length > 0 ? listing.images[0] : undefined,
    actions: {
      editUrl: `/listings/${listing.id}/edit`,
      viewUrl: `/listings/${listing.id}`,
    },
  });

  return res.json({
    groups: [
      {
        id: "active",
        label: "Active",
        description: "Listings currently visible to buyers",
        listings: activeListings.map(mapListing),
      },
      {
        id: "draft",
        label: "Inactive",
        description: "Listings not currently visible",
        listings: inactiveListings.map(mapListing),
      },
    ],
    createListingUrl: "/listings/new",
  });
});

router.get("/metrics", authMiddleware, async (_req: AuthenticatedRequest, res) => {
  return res.json([
    { label: "Total views", value: 0 },
    { label: "Active listings", value: 0 },
    { label: "Inquiries", value: 0 },
  ]);
});

router.get("/saved-items", authMiddleware, async (_req: AuthenticatedRequest, res) => {
  return res.json([]);
});

router.get("/preferences", authMiddleware, async (_req: AuthenticatedRequest, res) => {
  return res.json([]);
});

export default router;


