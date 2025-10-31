import { AppDataSource } from "../config";
import { ListingCategory } from "../entities/ListingCategory";

const categories = [
  { name: "Furniture", slug: "furniture" },
  { name: "Tools", slug: "tools" },
  { name: "Household Appliances", slug: "household-appliances" },
  { name: "Hardware", slug: "hardware" },
  { name: "Clothing", slug: "clothing" },
  { name: "Books", slug: "books" },
];

async function seedCategories() {
  try {
    await AppDataSource.initialize();
    console.log("Connected to database");

    const categoryRepository = AppDataSource.getRepository(ListingCategory);

    for (const categoryData of categories) {
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
