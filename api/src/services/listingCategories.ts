import type { DataSource, Repository } from "typeorm";
import { ListingCategory } from "../entities/ListingCategory";
import {
  DEFAULT_LISTING_CATEGORIES,
  DEFAULT_LISTING_CATEGORY_SLUGS,
} from "../constants/listingCategories";

export const isAllowedListingCategory = (category: ListingCategory) =>
  DEFAULT_LISTING_CATEGORY_SLUGS.has(category.slug);

export async function ensureDefaultListingCategories(dataSource: DataSource) {
  const repository = dataSource.getRepository(ListingCategory);
  for (const categoryData of DEFAULT_LISTING_CATEGORIES) {
    const existing = await repository.findOne({ where: { slug: categoryData.slug } });
    if (!existing) {
      const created = repository.create(categoryData);
      await repository.save(created);
    } else if (existing.name !== categoryData.name) {
      existing.name = categoryData.name;
      await repository.save(existing);
    }
  }
}

export async function findAllowedListingCategory(
  repository: Repository<ListingCategory>,
  categoryId: string,
) {
  const category = await repository.findOne({ where: { id: categoryId } });
  if (!category) {
    return null;
  }
  return isAllowedListingCategory(category) ? category : null;
}
