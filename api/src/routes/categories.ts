import { Router } from "express";
import { AppDataSource } from "../config";
import { ListingCategory } from "../entities/ListingCategory";
import { DEFAULT_LISTING_CATEGORY_SLUGS } from "../constants/listingCategories";

const router = Router();

router.get("/", async (_req, res) => {
  const categoryRepository = AppDataSource.getRepository(ListingCategory);
  const categories = await categoryRepository.find({ order: { name: "ASC" } });
  const allowed = categories.filter((category) =>
    DEFAULT_LISTING_CATEGORY_SLUGS.has(category.slug),
  );
  return res.json(allowed);
});

export default router;
