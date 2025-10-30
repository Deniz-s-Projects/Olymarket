import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { ListingDto } from "../dtos/listing";
import { AppDataSource } from "../config";
import { Listing } from "../entities/Listing";
import { ListingCategory } from "../entities/ListingCategory";
import { UserProfile } from "../entities/UserProfile";
import { sendNewListingAlert } from "../utils/email";

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
    });
    await listingRepository.save(listing);

    try {
      const profileRepository = AppDataSource.getRepository(UserProfile);
      const subscribers = await profileRepository.find({
        where: {
          notifyNewListings: true,
          user: { isVerified: true },
        },
        relations: { user: true },
      });

      const recipients = subscribers
        .filter((subscriber) => subscriber.user.id !== req.user!.id)
        .map((subscriber) => subscriber.user.email);

      await sendNewListingAlert(recipients, {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        ownerName: req.user!.name,
      });
    } catch (error) {
      console.error("Failed to send new listing alerts", error);
    }

    return res.status(201).json(listing);
  }
);

router.get("/", async (req, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listings = await listingRepository.find({ order: { createdAt: "DESC" } });
  return res.json(listings);
});

router.get("/search/query", async (req, res) => {
  const term = (req.query.q as string) || "";
  const listingRepository = AppDataSource.getRepository(Listing);
  const listings = await listingRepository
    .createQueryBuilder("listing")
    .leftJoinAndSelect("listing.owner", "owner")
    .leftJoinAndSelect("listing.category", "category")
    .where("listing.title ILIKE :term", { term: `%${term}%` })
    .orWhere("listing.description ILIKE :term", { term: `%${term}%` })
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
    if (listing.owner.id !== req.user!.id) {
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
  if (listing.owner.id !== req.user!.id) {
    return res.status(403).json({ message: "Not allowed" });
  }
  await listingRepository.remove(listing);
  return res.status(204).send();
});

export default router;
