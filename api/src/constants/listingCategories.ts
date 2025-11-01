export type DefaultListingCategory = {
  name: string;
  slug: string;
};

export const DEFAULT_LISTING_CATEGORIES: DefaultListingCategory[] = [
  { name: "Furniture", slug: "furniture" },
  { name: "Tools", slug: "tools" },
  { name: "Household Appliances", slug: "household-appliances" },
  { name: "Hardware", slug: "hardware" },
  { name: "Clothing & Accessories", slug: "clothing-accessories" },
  { name: "Books & Media", slug: "books-media" },
  { name: "Electronics", slug: "electronics" },
  { name: "Outdoor & Garden", slug: "outdoor-garden" },
  { name: "Sports & Fitness", slug: "sports-fitness" },
];

export const DEFAULT_LISTING_CATEGORY_SLUGS = new Set(
  DEFAULT_LISTING_CATEGORIES.map((category) => category.slug),
);
