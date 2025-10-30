import { Router } from "express";
import { AppDataSource } from "../config";
import { ListingCategory } from "../entities/ListingCategory";

const router = Router();

router.get("/", async (_req, res) => {
  const categoryRepository = AppDataSource.getRepository(ListingCategory);
  const categories = await categoryRepository.find({ order: { name: "ASC" } });
  return res.json(categories);
});

export default router;
