import { Router, type Request, type Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { ListingDto } from "../dtos/listing";
import { AppDataSource } from "../config";
import { Listing } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { SavedListing } from "../entities/SavedListing";
import type { SelectQueryBuilder } from "typeorm";

type ListingQueryFilters = {
  searchTerm?: string;
};

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

const parseNumberParam = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const parseBooleanParam = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const normalizeSortBy = (value: unknown): "price" | "createdAt" => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "price") {
      return "price";
    }
  }
  return "createdAt";
};

const normalizeSortOrder = (value: unknown): "ASC" | "DESC" => {
  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    if (normalized === "ASC") {
      return "ASC";
    }
  }
  return "DESC";
};

const buildListingsQuery = (
  req: Request,
  filters: ListingQueryFilters = {},
): { query: SelectQueryBuilder<Listing>; page: number; limit: number } => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const query = listingRepository
    .createQueryBuilder("listing")
    .leftJoinAndSelect("listing.owner", "owner")
    .leftJoinAndSelect("listing.category", "category")
    .where("listing.moderation_status = :status", { status: "approved" })
    .andWhere("owner.is_banned = false")
    .andWhere("listing.status = :activeStatus", { activeStatus: "active" });

  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  if (category) {
    query.andWhere("LOWER(category.name) = :categoryName", { categoryName: category.toLowerCase() });
  }

  const isFree = parseBooleanParam(req.query.isFree);
  if (typeof isFree === "boolean") {
    query.andWhere("listing.is_free = :isFree", { isFree });
  }

  const minPrice = parseNumberParam(req.query.minPrice);
  if (typeof minPrice === "number") {
    query.andWhere("listing.price >= :minPrice", { minPrice });
  }

  const maxPrice = parseNumberParam(req.query.maxPrice);
  if (typeof maxPrice === "number") {
    query.andWhere("listing.price <= :maxPrice", { maxPrice });
  }

  if (filters.searchTerm) {
    query.andWhere("(listing.title ILIKE :term OR listing.description ILIKE :term)", {
      term: `%${filters.searchTerm}%`,
    });
  }

  const sortBy = normalizeSortBy(req.query.sortBy);
  const sortOrder = normalizeSortOrder(req.query.sortOrder);
  const sortColumn = sortBy === "price" ? "listing.price" : "listing.createdAt";

  query.orderBy(sortColumn, sortOrder);
  if (sortColumn !== "listing.createdAt") {
    query.addOrderBy("listing.createdAt", "DESC");
  }

  const rawPage = parseNumberParam(req.query.page);
  const page = rawPage && rawPage > 0 ? Math.floor(rawPage) : 1;

  const rawLimit = parseNumberParam(req.query.limit);
  const limitCandidate = rawLimit && rawLimit > 0 ? Math.floor(rawLimit) : DEFAULT_PAGE_SIZE;
  const limit = Math.min(limitCandidate, MAX_PAGE_SIZE);

  query.skip((page - 1) * limit).take(limit);

  return { query, page, limit };
};

const respondWithPaginatedResults = async (
  req: Request,
  res: Response,
  filters: ListingQueryFilters = {},
) => {
  const { query, page, limit } = buildListingsQuery(req, filters);
  const [results, total] = await query.getManyAndCount();
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const hasMore = totalPages > 0 && page < totalPages;

  return res.json({
    data: results,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  });
};

const router = Router();

const LISTING_STATUSES = ["active", "draft", "sold"] as const;
type ListingStatus = (typeof LISTING_STATUSES)[number];

const isListingStatus = (value: unknown): value is ListingStatus =>
  typeof value === "string" && (LISTING_STATUSES as readonly string[]).includes(value);

const LISTING_CONDITIONS = ["new", "good", "used_but_works", "fixer_upper"] as const;
type ListingCondition = (typeof LISTING_CONDITIONS)[number];

const isListingCondition = (value: unknown): value is ListingCondition =>
  typeof value === "string" && (LISTING_CONDITIONS as readonly string[]).includes(value);

const resolveStatusFromBody = (body: any, fallback?: ListingStatus): ListingStatus | undefined => {
  if (isListingStatus(body?.status)) {
    return body.status;
  }

  if (typeof body?.isActive === "boolean") {
    return body.isActive ? "active" : "draft";
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

router.post(
  "/",
  authMiddleware,
  validationMiddleware(ListingDto),
  async (req: AuthenticatedRequest, res) => {
    const listingRepository = AppDataSource.getRepository(Listing);
    const categoryRepository = AppDataSource.getRepository(ListingCategory);

    let category: ListingCategory | null = null;
    if (req.body.categoryId) {
      category = await categoryRepository.findOne({ where: { id: req.body.categoryId } });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const requestedStatus = resolveStatusFromBody(req.body) ?? "active";
    const status: ListingStatus = requestedStatus === "sold" ? "active" : requestedStatus;
    const availability = typeof req.body.availability === "string" ? req.body.availability.trim() : "";
    const preferredContactMethod =
      typeof req.body.preferredContactMethod === "string" ? req.body.preferredContactMethod.trim() : "";
    const condition = isListingCondition(req.body.condition) ? req.body.condition : "used_but_works";

    const listing = listingRepository.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      isFree: req.body.isFree ?? false,
      isActive: status === "active",
      status,
      soldAt: null,
      owner: req.user!,
      category,
      images: Array.isArray(req.body.images) ? req.body.images : [],
      availability: availability || null,
      preferredContactMethod: preferredContactMethod || null,
      condition,
      moderationStatus: "approved",
    });
    await listingRepository.save(listing);
    return res.status(201).json(listing);
  }
);

router.get("/", async (req, res) => {
  return respondWithPaginatedResults(req, res);
});

router.get("/search/query", async (req, res) => {
  const term = typeof req.query.q === "string" ? req.query.q.trim() : "";
  return respondWithPaginatedResults(req, res, { searchTerm: term });
});

router.get("/:id", async (req, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listing = await listingRepository.findOne({
    where: { id: req.params.id },
    relations: { owner: true, category: true },
  });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }
  await listingRepository
    .createQueryBuilder()
    .update(Listing)
    .set({ viewsCount: () => '"views_count" + 1' })
    .where("id = :id", { id: listing.id })
    .execute();
  listing.viewsCount = (listing.viewsCount ?? 0) + 1;
  return res.json(listing);
});

router.put(
  "/:id",
  authMiddleware,
  validationMiddleware(ListingDto),
  async (req: AuthenticatedRequest, res) => {
    const listingRepository = AppDataSource.getRepository(Listing);
    const categoryRepository = AppDataSource.getRepository(ListingCategory);
    const listing = await listingRepository.findOne({
      where: { id: req.params.id },
      relations: { owner: true, category: true },
    });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    let category = listing.category;
    if (typeof req.body.categoryId !== "undefined") {
      if (req.body.categoryId === "") {
        category = null;
      } else {
        const found = await categoryRepository.findOne({ where: { id: req.body.categoryId } });
        if (!found) {
          return res.status(404).json({ message: "Category not found" });
        }
        category = found;
      }
    }

    const availability = typeof req.body.availability === "string" ? req.body.availability.trim() : "";
    const preferredContactMethod =
      typeof req.body.preferredContactMethod === "string" ? req.body.preferredContactMethod.trim() : "";

    listing.title = req.body.title;
    listing.description = req.body.description;
    listing.price = req.body.price;
    listing.isFree = req.body.isFree ?? listing.isFree;

    const resolvedStatus = resolveStatusFromBody(req.body, listing.status) ?? listing.status;
    if (
      resolvedStatus === "sold" &&
      listing.status !== "sold" &&
      listing.owner.id !== req.user!.id &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({ message: "Only the owner or an admin can mark a listing as sold" });
    }

    applyStatusToListing(listing, resolvedStatus);
    listing.category = category ?? null;
    listing.availability = availability || null;
    listing.preferredContactMethod = preferredContactMethod || null;
    if (typeof req.body.condition !== "undefined" && isListingCondition(req.body.condition)) {
      listing.condition = req.body.condition;
    }
    if (Array.isArray(req.body.images)) {
      listing.images = req.body.images;
    }

    const saved = await listingRepository.save(listing);
    return res.json(saved);
  }
);

router.patch("/:id/status", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listing = await listingRepository.findOne({
    where: { id: req.params.id },
    relations: { owner: true },
  });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ message: "Not allowed" });
  }

  const status = resolveStatusFromBody(req.body);
  if (!status || !isListingStatus(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (status === "sold" && listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ message: "Only the owner or an admin can mark a listing as sold" });
  }

  applyStatusToListing(listing, status);

  const saved = await listingRepository.save(listing);
  return res.json(saved);
});

router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listing = await listingRepository.findOne({
    where: { id: req.params.id },
    relations: { owner: true },
  });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }
  if (listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ message: "Not allowed" });
  }
  await listingRepository.remove(listing);
  return res.status(204).send();
});

// Check if a listing is saved by the current user
router.get("/:id/saved", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const savedListingRepository = AppDataSource.getRepository(SavedListing);
  const saved = await savedListingRepository.findOne({
    where: {
      user: { id: req.user!.id },
      listing: { id: req.params.id },
    },
  });
  return res.json({ isSaved: Boolean(saved) });
});

// Save a listing
router.post("/:id/save", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const savedListingRepository = AppDataSource.getRepository(SavedListing);

  const listing = await listingRepository.findOne({ where: { id: req.params.id } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  // Check if already saved
  const existing = await savedListingRepository.findOne({
    where: {
      user: { id: req.user!.id },
      listing: { id: req.params.id },
    },
  });

  if (existing) {
    return res.json({
      message: "Already saved",
      isSaved: true,
      savesCount: listing.savesCount ?? 0,
    });
  }

  const savedListing = savedListingRepository.create({
    user: req.user!,
    listing,
  });
  await savedListingRepository.save(savedListing);

  await listingRepository
    .createQueryBuilder()
    .update(Listing)
    .set({ savesCount: () => '"saves_count" + 1' })
    .where("id = :id", { id: listing.id })
    .execute();
  listing.savesCount = (listing.savesCount ?? 0) + 1;

  return res.status(201).json({
    message: "Listing saved",
    isSaved: true,
    savesCount: listing.savesCount,
  });
});

// Unsave a listing
router.delete("/:id/save", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const savedListingRepository = AppDataSource.getRepository(SavedListing);

  const listing = await listingRepository.findOne({ where: { id: req.params.id } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const saved = await savedListingRepository.findOne({
    where: {
      user: { id: req.user!.id },
      listing: { id: req.params.id },
    },
  });

  if (!saved) {
    return res.status(404).json({ message: "Listing not saved" });
  }

  await savedListingRepository.remove(saved);
  await listingRepository
    .createQueryBuilder()
    .update(Listing)
    .set({
      savesCount: () => 'CASE WHEN "saves_count" > 0 THEN "saves_count" - 1 ELSE 0 END',
    })
    .where("id = :id", { id: listing.id })
    .execute();
  listing.savesCount = Math.max((listing.savesCount ?? 0) - 1, 0);

  return res.json({
    message: "Listing unsaved",
    isSaved: false,
    savesCount: listing.savesCount,
  });
});

export default router;
