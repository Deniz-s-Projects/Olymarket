import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, requireAdmin, AuthenticatedRequest } from "../middleware/auth";
import { Listing } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { User } from "../entities/User";
import { validationMiddleware } from "../middleware/validate";
import { AdminListingUpdateDto } from "../dtos/admin";

const router = Router();

// All routes below require auth + admin
router.use(authMiddleware, requireAdmin);

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


