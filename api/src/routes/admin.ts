import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, requireAdmin, AuthenticatedRequest } from "../middleware/auth";
import { Listing } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { User } from "../entities/User";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { validationMiddleware } from "../middleware/validate";
import { AdminListingUpdateDto, AdminCreateUserDto, AdminUpdateUserDto } from "../dtos/admin";
import { getNextExpiryDate } from "../services/listingExpiry";
import { findAllowedListingCategory } from "../services/listingCategories";
import { hashPassword } from "../utils/password";

const router = Router();

const mapUserToAdminResponse = (user: User, listingsCount = 0) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phoneNumber: user.phoneNumber,
  role: user.role,
  location: user.location,
  bio: user.bio,
  isBanned: user.isBanned,
  bannedAt: user.bannedAt ? user.bannedAt.toISOString() : null,
  banReason: user.banReason,
  listingsCount,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

const ALL_LISTING_STATUSES = ["active", "draft", "sold", "expired"] as const;
type ListingStatus = (typeof ALL_LISTING_STATUSES)[number];

const MUTABLE_LISTING_STATUSES = ["active", "draft", "sold"] as const;
type MutableListingStatus = (typeof MUTABLE_LISTING_STATUSES)[number];

const isMutableListingStatus = (value: unknown): value is MutableListingStatus =>
  typeof value === "string" && (MUTABLE_LISTING_STATUSES as readonly string[]).includes(value);

const resolveStatusFromBody = (body: any, fallback: ListingStatus): ListingStatus => {
  if (isMutableListingStatus(body?.status)) {
    return body.status;
  }

  if (typeof body?.isActive === "boolean") {
    return body.isActive ? "active" : fallback === "sold" ? "sold" : "draft";
  }

  return fallback;
};

const applyStatusToListing = (listing: Listing, status: ListingStatus) => {
  const previousStatus = listing.status;
  listing.status = status;
  listing.isActive = status === "active";

  if (status === "sold") {
    if (previousStatus !== "sold" || !listing.soldAt) {
      listing.soldAt = new Date();
    }
  } else if (previousStatus === "sold") {
    listing.soldAt = null;
  }
};

// All routes below require auth + admin
router.use(authMiddleware, requireAdmin);

// GET /admin/stats - Get usage statistics
router.get("/stats", async (_req, res) => {
  const listingRepo = AppDataSource.getRepository(Listing);
  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(ListingCategory);
  const conversationRepo = AppDataSource.getRepository(Conversation);
  const messageRepo = AppDataSource.getRepository(Message);

  // Get listing counts by status
  const listingAggregates = await listingRepo
    .createQueryBuilder("listing")
    .select("COUNT(*)", "total")
    .addSelect(
      "SUM(CASE WHEN listing.moderationStatus = 'pending' THEN 1 ELSE 0 END)",
      "pending",
    )
    .addSelect(
      "SUM(CASE WHEN listing.moderationStatus = 'approved' THEN 1 ELSE 0 END)",
      "approved",
    )
    .addSelect(
      "SUM(CASE WHEN listing.moderationStatus = 'rejected' THEN 1 ELSE 0 END)",
      "rejected",
    )
    .addSelect(
      "SUM(CASE WHEN listing.isActive = TRUE THEN 1 ELSE 0 END)",
      "active",
    )
    .getRawOne<{
      total: string | null;
      pending: string | null;
      approved: string | null;
      rejected: string | null;
      active: string | null;
    }>();

  const listingStats = {
    total: Number(listingAggregates?.total ?? 0),
    pending: Number(listingAggregates?.pending ?? 0),
    approved: Number(listingAggregates?.approved ?? 0),
    rejected: Number(listingAggregates?.rejected ?? 0),
    active: Number(listingAggregates?.active ?? 0),
  };

  // Get user counts
  const userAggregates = await userRepo
    .createQueryBuilder("user")
    .select("COUNT(*)", "total")
    .addSelect(
      "SUM(CASE WHEN user.isBanned = FALSE THEN 1 ELSE 0 END)",
      "active",
    )
    .addSelect(
      "SUM(CASE WHEN user.isBanned = TRUE THEN 1 ELSE 0 END)",
      "banned",
    )
    .getRawOne<{
      total: string | null;
      active: string | null;
      banned: string | null;
    }>();

  const userStats = {
    total: Number(userAggregates?.total ?? 0),
    active: Number(userAggregates?.active ?? 0),
    banned: Number(userAggregates?.banned ?? 0),
  };

  // Get category stats - count listings per category
  const categoriesWithCounts = await categoryRepo
    .createQueryBuilder("category")
    .leftJoin("category.listings", "listing")
    .select("category.id", "id")
    .addSelect("category.name", "name")
    .addSelect("COUNT(listing.id)", "listingCount")
    .groupBy("category.id")
    .addGroupBy("category.name")
    .orderBy("COUNT(listing.id)", "DESC")
    .limit(10)
    .getRawMany<{ id: string; name: string; listingCount: string }>();

  const popularCategories = categoriesWithCounts.map((cat) => ({
    id: cat.id,
    name: cat.name,
    listingCount: Number(cat.listingCount || 0),
  }));

  // Get conversation and message counts
  const conversationStats = {
    total: await conversationRepo.count(),
  };

  const messageStats = {
    total: await messageRepo.count(),
  };

  return res.json({
    listings: listingStats,
    users: userStats,
    conversations: conversationStats,
    messages: messageStats,
    popularCategories,
  });
});

// GET /admin/listings?status=&owner=&from=&to=&page=&limit=
router.get("/listings", async (req, res) => {
  const status = (req.query.status as string) || undefined;
  const owner = (req.query.owner as string) || undefined;
  const from = (req.query.from as string) || undefined;
  const to = (req.query.to as string) || undefined;
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const offset = (page - 1) * limit;

  const qb = AppDataSource.getRepository(Listing)
    .createQueryBuilder("listing")
    .leftJoinAndSelect("listing.owner", "owner")
    .leftJoinAndSelect("listing.category", "category")
    .orderBy("listing.createdAt", "DESC")
    .skip(offset)
    .take(limit);

  if (status) qb.andWhere("listing.moderationStatus = :status", { status });
  if (owner) qb.andWhere("owner.id = :owner", { owner });
  if (from) qb.andWhere("listing.createdAt >= :from", { from });
  if (to) qb.andWhere("listing.createdAt <= :to", { to });

  const [items, total] = await qb.getManyAndCount();
  return res.json({ items, total, page, limit });
});

// PATCH /admin/listings/:id
router.patch(
  "/listings/:id",
  validationMiddleware(AdminListingUpdateDto),
  async (req: AuthenticatedRequest, res) => {
    const listingRepository = AppDataSource.getRepository(Listing);
    const categoryRepository = AppDataSource.getRepository(ListingCategory);
    const listing = await listingRepository.findOne({ where: { id: req.params.id } });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (typeof req.body.title === "string") listing.title = req.body.title;
    if (typeof req.body.description === "string") listing.description = req.body.description;
    if (typeof req.body.price === "string") listing.price = req.body.price;

    if (typeof req.body.categoryId !== "undefined") {
      const rawCategoryId = typeof req.body.categoryId === "string" ? req.body.categoryId.trim() : "";
      if (!rawCategoryId) {
        return res.status(400).json({ message: "Category is required" });
      }
      const found = await findAllowedListingCategory(categoryRepository, rawCategoryId);
      if (!found) {
        return res.status(400).json({ message: "Invalid category selection" });
      }
      listing.category = found;
    }

    const previousStatus = listing.status;
    const nextStatus = resolveStatusFromBody(req.body, listing.status);
    applyStatusToListing(listing, nextStatus);
    if (previousStatus !== "active" && nextStatus === "active") {
      listing.expiresAt = getNextExpiryDate();
    }

    if (typeof req.body.moderationStatus === "string") {
      listing.moderationStatus = req.body.moderationStatus as any;
      listing.reviewer = req.user!;
      listing.reviewedAt = new Date();
    }
    if (typeof req.body.moderationNotes === "string") {
      listing.moderationNotes = req.body.moderationNotes;
    }

    if (typeof req.body.adminNotice !== "undefined") {
      const trimmed = typeof req.body.adminNotice === "string" ? req.body.adminNotice.trim() : "";
      listing.adminNotice = trimmed.length > 0 ? trimmed : null;
    }

    if (typeof req.body.adminNoticeSeverity === "string") {
      listing.adminNoticeSeverity = req.body.adminNoticeSeverity as Listing["adminNoticeSeverity"];
    }

    const saved = await listingRepository.save(listing);
    return res.json(saved);
  }
);

// DELETE /admin/listings/:id
router.delete("/listings/:id", async (req, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listing = await listingRepository.findOne({ where: { id: req.params.id } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }
  await AppDataSource.createQueryBuilder()
    .delete()
    .from("saved_listings")
    .where("listing_id = :id", { id: listing.id })
    .execute();
    
  await listingRepository.remove(listing);
  return res.status(204).send();
});

// GET /admin/users
router.get("/users", async (_req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const users = await userRepository.find();

  // Count listings per user
  const listingRepo = AppDataSource.getRepository(Listing);
  const counts = await listingRepo
    .createQueryBuilder("listing")
    .select("listing.owner", "ownerId")
    .addSelect("COUNT(listing.id)", "count")
    .groupBy("listing.owner")
    .getRawMany<{ ownerId: string; count: string }>();
  const countsMap = new Map(counts.map((r) => [r.ownerId, Number(r.count)]));

  return res.json(users.map((u) => mapUserToAdminResponse(u, countsMap.get(u.id) ?? 0)));
});

// POST /admin/users
router.post("/users", validationMiddleware(AdminCreateUserDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);

  const existing = await userRepository.findOne({ where: { email: req.body.email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await hashPassword(req.body.password);
  const user = userRepository.create({
    email: req.body.email.trim(),
    name: req.body.name.trim(),
    phoneNumber: req.body.phoneNumber.trim(),
    passwordHash,
    role: req.body.role ?? "user",
    location: typeof req.body.location === "string" && req.body.location.trim().length > 0 ? req.body.location.trim() : null,
    bio: typeof req.body.bio === "string" && req.body.bio.trim().length > 0 ? req.body.bio.trim() : null,
  });

  const saved = await userRepository.save(user);
  return res.status(201).json(mapUserToAdminResponse(saved));
});

// PATCH /admin/users/:id
router.patch("/users/:id", validationMiddleware(AdminUpdateUserDto), async (req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (typeof req.body.email === "string") {
    const trimmed = req.body.email.trim();
    if (trimmed.length > 0 && trimmed !== user.email) {
      const existing = await userRepository.findOne({ where: { email: trimmed } });
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ message: "Email already registered" });
      }
      user.email = trimmed;
    }
  }

  if (typeof req.body.name === "string") {
    const trimmed = req.body.name.trim();
    if (trimmed.length > 0) {
      user.name = trimmed;
    }
  }

  if (typeof req.body.phoneNumber === "string") {
    const trimmed = req.body.phoneNumber.trim();
    if (trimmed.length > 0) {
      user.phoneNumber = trimmed;
    }
  }

  if (typeof req.body.location === "string") {
    const trimmed = req.body.location.trim();
    user.location = trimmed.length > 0 ? trimmed : null;
  }

  if (typeof req.body.bio === "string") {
    const trimmed = req.body.bio.trim();
    user.bio = trimmed.length > 0 ? trimmed : null;
  }

  if (typeof req.body.role === "string") {
    user.role = req.body.role;
  }

  if (typeof req.body.password === "string" && req.body.password.trim().length > 0) {
    user.passwordHash = await hashPassword(req.body.password);
  }

  const saved = await userRepository.save(user);
  const listingCountRepository = AppDataSource.getRepository(Listing);
  const listingsCount = await listingCountRepository.count({ where: { owner: { id: saved.id } } });

  return res.json(mapUserToAdminResponse(saved, listingsCount));
});

// POST /admin/users/:id/ban
router.post("/users/:id/ban", async (req: AuthenticatedRequest, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ message: "User not found" });
  user.isBanned = true;
  user.bannedAt = new Date();
  user.banReason = typeof req.body?.reason === "string" ? req.body.reason : user.banReason;
  await userRepository.save(user);
  return res.json({ id: user.id, isBanned: user.isBanned, bannedAt: user.bannedAt, banReason: user.banReason });
});

// POST /admin/users/:id/unban
router.post("/users/:id/unban", async (_req, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOne({ where: { id: (res.req as any).params.id } });
  if (!user) return res.status(404).json({ message: "User not found" });
  user.isBanned = false;
  user.bannedAt = null;
  user.banReason = null;
  await userRepository.save(user);
  return res.json({ id: user.id, isBanned: user.isBanned });
});

export default router;


