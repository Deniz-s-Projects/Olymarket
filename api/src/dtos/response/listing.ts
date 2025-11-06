import { Listing } from "../../entities/Listing";
import { PublicUserDto, mapUserToPublicDto } from "./user";

export type ListingCategoryDto = {
  id: string;
  name: string;
  slug: string;
};

export type ListingPublicContactInfoDto = {
  method: string;
  email?: string | null;
  phoneNumber?: string | null;
  value?: string | null;
};

export type ListingResponseDto = {
  id: string;
  title: string;
  description: string;
  price: string;
  isFree: boolean;
  isActive: boolean;
  status: Listing["status"];
  soldAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: PublicUserDto;
  reviewer: PublicUserDto | null;
  category: ListingCategoryDto | null;
  images: string[] | null;
  viewsCount: number;
  savesCount: number;
  availability: string | null;
  preferredContactMethod: string | null;
  showContactInfo: boolean;
  publicContactInfo: ListingPublicContactInfoDto | null;
  condition: Listing["condition"];
  moderationStatus: Listing["moderationStatus"];
  moderationNotes: string | null;
};

const buildPublicContactInfo = (listing: Listing): ListingPublicContactInfoDto | null => {
  if (!listing.showContactInfo) {
    return null;
  }

  const method = listing.preferredContactMethod?.trim();
  if (!method) {
    return null;
  }

  const normalizedMethod = method.toLowerCase();

  if (normalizedMethod === "email") {
    return {
      method,
      value: listing.owner.email,
    };
  }

  if (normalizedMethod === "phone") {
    return {
      method,
      value: listing.owner.phoneNumber,
    };
  }

  return {
    method,
  };
};

export const mapListingToResponse = (listing: Listing): ListingResponseDto => ({
  id: listing.id,
  title: listing.title,
  description: listing.description,
  price: listing.price,
  isFree: listing.isFree,
  isActive: listing.isActive,
  status: listing.status,
  soldAt: listing.soldAt ? listing.soldAt.toISOString() : null,
  expiresAt: listing.expiresAt ? listing.expiresAt.toISOString() : null,
  createdAt: listing.createdAt.toISOString(),
  updatedAt: listing.updatedAt.toISOString(),
  owner: mapUserToPublicDto(listing.owner),
  reviewer: listing.reviewer ? mapUserToPublicDto(listing.reviewer) : null,
  category: listing.category
    ? {
        id: listing.category.id,
        name: listing.category.name,
        slug: listing.category.slug,
      }
    : null,
  images: listing.images ?? [],
  viewsCount: listing.viewsCount ?? 0,
  savesCount: listing.savesCount ?? 0,
  availability: listing.availability,
  preferredContactMethod: listing.preferredContactMethod,
  showContactInfo: listing.showContactInfo,
  publicContactInfo: buildPublicContactInfo(listing),
  condition: listing.condition,
  moderationStatus: listing.moderationStatus,
  moderationNotes: listing.moderationNotes,
});
