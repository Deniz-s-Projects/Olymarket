import { Router } from "express";
import { AppDataSource } from "../config";
import { User } from "../entities/User";
import { Listing } from "../entities/Listing";
import { SavedListing } from "../entities/SavedListing";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { UserPreference } from "../entities/UserPreference";

type PreferenceKey = keyof Pick<
  UserPreference,
  "marketplaceAlerts" | "savedSearchDigests" | "communityNews"
>;

type PreferenceDefinition = {
  id: PreferenceKey;
  label: string;
  description: string;
};

const PREFERENCE_DEFINITIONS: PreferenceDefinition[] = [
  {
    id: "marketplaceAlerts",
    label: "Marketplace alerts",
    description: "Get notified when buyers interact with your listings or send offers.",
  },
  {
    id: "savedSearchDigests",
    label: "Saved search digests",
    description: "Receive a weekly summary when new listings match your saved searches.",
  },
  {
    id: "communityNews",
    label: "Community news",
    description: "Stay informed about product updates and important community announcements.",
  },
];

const mapPreferencesToResponse = (preferences: UserPreference) =>
  PREFERENCE_DEFINITIONS.map((definition) => {
    const key = definition.id;
    const value = (preferences as unknown as Record<PreferenceKey, boolean>)[key];

    return {
      id: definition.id,
      label: definition.label,
      description: definition.description,
      enabled: Boolean(value),
    };
  });

const ensureUserPreferences = async (userId: string) => {
  const preferenceRepository = AppDataSource.getRepository(UserPreference);

  let preferences = await preferenceRepository.findOne({
    where: { user: { id: userId } },
    relations: { user: true },
  });

  if (!preferences) {
    preferences = preferenceRepository.create({
      user: { id: userId } as User,
      marketplaceAlerts: false,
      savedSearchDigests: false,
      communityNews: false,
    });
    preferences = await preferenceRepository.save(preferences);
  }

  if (!preferences.user) {
    preferences.user = { id: userId } as User;
  }

  return preferences;
};

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

  const mapListing = (listing: Listing) => {
    const isApproved = listing.moderationStatus === "approved";
    const effectiveStatus: Listing["status"] = listing.status === "sold"
      ? "sold"
      : isApproved
      ? listing.status
      : "draft";

    const statusOptions: { status: Listing["status"]; label: string }[] = [];
    if (effectiveStatus === "active") {
      statusOptions.push(
        { status: "sold", label: "Mark as sold" },
        { status: "draft", label: "Move to draft" }
      );
    } else if (effectiveStatus === "draft") {
      statusOptions.push({ status: "active", label: "Publish listing" });
      statusOptions.push({ status: "sold", label: "Mark as sold" });
    } else if (effectiveStatus === "sold") {
      statusOptions.push({ status: "active", label: "Mark as available" });
      statusOptions.push({ status: "draft", label: "Move to draft" });
    }

    return {
      id: listing.id,
      title: listing.title,
      category: listing.category?.name || "Uncategorized",
      price: parseFloat(listing.price),
      currency: "EUR",
      status: effectiveStatus,
      updatedAt: listing.updatedAt.toISOString(),
      thumbnailUrl: listing.images && listing.images.length > 0 ? listing.images[0] : undefined,
      actions: {
        editUrl: `/listings/${listing.id}/edit`,
        viewUrl: `/listings/${listing.id}`,
        statusOptions,
      },
    };
  };

  const mappedListings = listings.map(mapListing);

  return res.json({
    groups: [
      {
        id: "active",
        label: "Active",
        description: "Listings currently visible to buyers",
        listings: mappedListings.filter((listing) => listing.status === "active"),
      },
      {
        id: "draft",
        label: "Draft",
        description: "Listings not currently visible",
        listings: mappedListings.filter((listing) => listing.status === "draft"),
      },
      {
        id: "sold",
        label: "Sold",
        description: "Completed listings you can archive or relist",
        listings: mappedListings.filter((listing) => listing.status === "sold"),
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

router.get("/saved-items", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const savedListingRepository = AppDataSource.getRepository(SavedListing);
  const savedListings = await savedListingRepository.find({
    where: { user: { id: req.user!.id } },
    relations: { listing: { category: true } },
    order: { createdAt: "DESC" },
  });

  const items = savedListings.map((saved) => ({
    id: saved.listing.id,
    title: saved.listing.title,
    category: saved.listing.category?.name || "Uncategorized",
    price: parseFloat(saved.listing.price),
    currency: "EUR",
    favoritedAt: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(saved.createdAt),
    thumbnailUrl: saved.listing.images && saved.listing.images.length > 0 ? saved.listing.images[0] : undefined,
  }));

  return res.json(items);
});

router.get("/preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const preferences = await ensureUserPreferences(req.user!.id);
  return res.json(mapPreferencesToResponse(preferences));
});

router.patch("/preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const preferenceRepository = AppDataSource.getRepository(UserPreference);
  const preferences = await ensureUserPreferences(req.user!.id);
  const preferenceRecord = preferences as unknown as Record<PreferenceKey, boolean>;

  let hasUpdates = false;

  for (const definition of PREFERENCE_DEFINITIONS) {
    const key = definition.id;
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      const value = req.body[key];
      if (typeof value === "boolean") {
        if (preferenceRecord[key] !== value) {
          preferenceRecord[key] = value;
          hasUpdates = true;
        }
      }
    }
  }

  const updatedPreferences = hasUpdates
    ? await preferenceRepository.save(preferences)
    : preferences;

  return res.json(mapPreferencesToResponse(updatedPreferences));
});

export default router;


