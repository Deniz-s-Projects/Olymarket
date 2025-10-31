import { Router, type Request, type Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { ListingDto } from "../dtos/listing";
import { AppDataSource } from "../config";
import { Listing, ListingStatus } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { SavedListing } from "../entities/SavedListing";
import type { SelectQueryBuilder } from "typeorm";
import { ListingStatusDto } from "../dtos/listing-status";

type ListingQueryFilters = {
  searchTerm?: string;
};

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 12;

const LISTING_STATUSES: ListingStatus[] = ["active", "draft", "sold"];

const parseStatusParam = (value: unknown): ListingStatus | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return LISTING_STATUSES.find((status) => status === normalized) ?? undefined;
};

const resolveStatusFromBody = (
  body: Record<string, unknown>,
  defaultStatus: ListingStatus = "active",
): ListingStatus => {
  const status = parseStatusParam(body.status);
  if (status) {
    return status;
  }

  if (typeof body.isActive === "boolean") {
    return body.isActive ? "active" : "draft";
  }

  return defaultStatus;
};

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
    .andWhere("listing.status = :statusFilter", { statusFilter: "active" })
    .andWhere("owner.is_banned = false");

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
  const sortColumn = sortBy === "price" ? "listing.price" : "listing.created_at";

  query.orderBy(sortColumn, sortOrder);
  if (sortColumn !== "listing.created_at") {
    query.addOrderBy("listing.created_at", "DESC");
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

    const availability = typeof req.body.availability === "string" ? req.body.availability.trim() : "";
    const preferredContactMethod =
      typeof req.body.preferredContactMethod === "string" ? req.body.preferredContactMethod.trim() : "";

    const status = resolveStatusFromBody(req.body ?? {}, "active");

    const listing = listingRepository.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      isFree: req.body.isFree ?? false,
      isActive: status === "active",
      status,
      owner: req.user!,
      category,
      images: Array.isArray(req.body.images) ? req.body.images : [],
      availability: availability || null,
      preferredContactMethod: preferredContactMethod || null,
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
    listing.category = category ?? null;
    listing.availability = availability || null;
    listing.preferredContactMethod = preferredContactMethod || null;
    if (Array.isArray(req.body.images)) {
      listing.images = req.body.images;
    }

    const nextStatus = resolveStatusFromBody(req.body ?? {}, listing.status);
    if (nextStatus !== listing.status) {
      if (nextStatus === "sold" && listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only the owner or an admin can mark a listing as sold." });
      }

      listing.status = nextStatus;
    }

    listing.isActive = listing.status === "active";

    const saved = await listingRepository.save(listing);
    return res.json(saved);
  }
);

router.patch(
  "/:id/status",
  authMiddleware,
  validationMiddleware(ListingStatusDto),
  async (req: AuthenticatedRequest, res) => {
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

    const requestedStatus = req.body.status as ListingStatus;
    if (requestedStatus === "sold" && listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Only the owner or an admin can mark a listing as sold." });
    }

    listing.status = requestedStatus;
    listing.isActive = listing.status === "active";

    const saved = await listingRepository.save(listing);
    return res.json(saved);
  },
);

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
