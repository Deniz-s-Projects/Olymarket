import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, requireAdmin, AuthenticatedRequest } from "../middleware/auth";
import { Listing } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { User } from "../entities/User";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { validationMiddleware } from "../middleware/validate";
import { AdminListingUpdateDto } from "../dtos/admin";

const router = Router();

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
  const listingsByStatus = await listingRepo
    .createQueryBuilder("listing")
    .select("listing.moderationStatus", "status")
    .addSelect("COUNT(listing.id)", "count")
    .groupBy("listing.moderationStatus")
    .getRawMany<{ status: string; count: string }>();

  const listingStats = {
    total: await listingRepo.count(),
    pending: 0,
    approved: 0,
    rejected: 0,
    active: await listingRepo.count({ where: { isActive: true } }),
  };
  
  listingsByStatus.forEach((stat) => {
    const count = Number(stat.count);
    if (stat.status === "pending") listingStats.pending = count;
    else if (stat.status === "approved") listingStats.approved = count;
    else if (stat.status === "rejected") listingStats.rejected = count;
  });

  // Get user counts
  const userStats = {
    total: await userRepo.count(),
    active: await userRepo.count({ where: { isBanned: false } }),
    banned: await userRepo.count({ where: { isBanned: true } }),
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
    if (typeof req.body.isActive === "boolean") listing.isActive = req.body.isActive;

    if (typeof req.body.categoryId !== "undefined") {
      if (req.body.categoryId === "") {
        listing.category = null;
      } else {
        const found = await categoryRepository.findOne({ where: { id: req.body.categoryId } });
        if (!found) {
          return res.status(404).json({ message: "Category not found" });
        }
        listing.category = found;
      }
    }

    if (typeof req.body.moderationStatus === "string") {
      listing.moderationStatus = req.body.moderationStatus as any;
      listing.reviewer = req.user!;
      listing.reviewedAt = new Date();
    }
    if (typeof req.body.moderationNotes === "string") {
      listing.moderationNotes = req.body.moderationNotes;
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

  return res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isBanned: u.isBanned,
      bannedAt: u.bannedAt,
      banReason: u.banReason,
      listingsCount: countsMap.get(u.id) ?? 0,
    }))
  );
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


