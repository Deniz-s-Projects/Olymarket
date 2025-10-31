import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { ListingDto } from "../dtos/listing";
import { AppDataSource } from "../config";
import { Listing } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { SavedListing } from "../entities/SavedListing";

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

    const listing = listingRepository.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      isActive: req.body.isActive ?? true,
      owner: req.user!,
      category,
      images: Array.isArray(req.body.images) ? req.body.images : [],
      moderationStatus: "approved",
    });
    await listingRepository.save(listing);
    return res.status(201).json(listing);
  }
);

router.get("/", async (_req, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listings = await listingRepository
    .createQueryBuilder("listing")
    .leftJoinAndSelect("listing.owner", "owner")
    .leftJoinAndSelect("listing.category", "category")
    .where("listing.moderation_status = :status", { status: "approved" })
    .andWhere("owner.is_banned = false")
    .orderBy("listing.created_at", "DESC")
    .getMany();
  return res.json(listings);
});

router.get("/search/query", async (req, res) => {
  const term = (req.query.q as string) || "";
  const listingRepository = AppDataSource.getRepository(Listing);
  const listings = await listingRepository
    .createQueryBuilder("listing")
    .leftJoinAndSelect("listing.owner", "owner")
    .leftJoinAndSelect("listing.category", "category")
    .where("listing.moderation_status = :status", { status: "approved" })
    .andWhere("owner.is_banned = false")
    .andWhere("(listing.title ILIKE :term OR listing.description ILIKE :term)", { term: `%${term}%` })
    .orderBy("listing.created_at", "DESC")
    .getMany();
  return res.json(listings);
});

router.get("/:id", async (req, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listing = await listingRepository.findOne({ where: { id: req.params.id } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }
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

    listing.title = req.body.title;
    listing.description = req.body.description;
    listing.price = req.body.price;
    listing.isActive = req.body.isActive ?? listing.isActive;
    listing.category = category ?? null;
    if (Array.isArray(req.body.images)) {
      listing.images = req.body.images;
    }

    const saved = await listingRepository.save(listing);
    return res.json(saved);
  }
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
    return res.json({ message: "Already saved", isSaved: true });
  }

  const savedListing = savedListingRepository.create({
    user: req.user!,
    listing,
  });
  await savedListingRepository.save(savedListing);

  return res.status(201).json({ message: "Listing saved", isSaved: true });
});

// Unsave a listing
router.delete("/:id/save", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const savedListingRepository = AppDataSource.getRepository(SavedListing);

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
  return res.json({ message: "Listing unsaved", isSaved: false });
});

export default router;
