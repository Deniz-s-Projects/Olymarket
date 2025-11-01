import { AppDataSource } from "../config";
import { ListingCategory } from "../entities/ListingCategory";
import { DEFAULT_LISTING_CATEGORIES } from "../constants/listingCategories";

async function seedCategories() {
  try {
    await AppDataSource.initialize();
    console.log("Connected to database");

    const categoryRepository = AppDataSource.getRepository(ListingCategory);

    for (const categoryData of DEFAULT_LISTING_CATEGORIES) {
      const existing = await categoryRepository.findOne({
        where: { slug: categoryData.slug },
      });

      if (!existing) {
        const category = categoryRepository.create(categoryData);
        await categoryRepository.save(category);
        console.log(`Created category: ${categoryData.name}`);
      } else {
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    console.log("\nAll categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

seedCategories();
