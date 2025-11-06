import { describe, expect, it } from "vitest";
import { mapListingToResponse } from "./listing";
import type { Listing } from "../../entities/Listing";
import type { User } from "../../entities/User";

const createUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  email: "owner@example.com",
  passwordHash: "hashed",
  name: "Owner",
  phoneNumber: "555-0000",
  location: null,
  bio: null,
  role: "user",
  isBanned: false,
  bannedAt: null,
  banReason: null,
  listings: [],
  conversationParticipants: [],
  messages: [],
  savedListings: [],
  groupMemberships: [],
  offersMade: [],
  offersReceived: [],
  preference: null,
  wantedListings: [],
  fulfilledWantedRequests: [],
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

const createListing = (overrides: Partial<Listing> = {}): Listing => {
  const owner = overrides.owner ?? createUser();
  return {
    id: "listing-1",
    title: "Sample Listing",
    description: "A nice thing",
    price: "10.00",
    isFree: false,
    isActive: true,
    status: "active",
    soldAt: null,
    expiresAt: new Date("2024-02-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
    updatedAt: new Date("2024-01-20T00:00:00.000Z"),
    owner,
    reviewer: null,
    category: null,
    images: [],
    viewsCount: 0,
    savesCount: 0,
    availability: null,
    preferredContactMethod: null,
    showContactInfo: false,
    condition: "good",
    moderationStatus: "approved",
    moderationNotes: null,
    offers: [],
    comments: [],
    ...overrides,
  } as Listing;
};

describe("mapListingToResponse", () => {
  it("omits public contact details when showContactInfo is false", () => {
    const listing = createListing({
      preferredContactMethod: "Email",
      showContactInfo: false,
    });

    const response = mapListingToResponse(listing);

    expect(response.showContactInfo).toBe(false);
    expect(response.publicContactInfo).toBeNull();
  });

  it("includes the owner's email when showContactInfo is true and method is Email", () => {
    const listing = createListing({
      preferredContactMethod: "Email",
      showContactInfo: true,
    });

    const response = mapListingToResponse(listing);

    expect(response.publicContactInfo).toEqual({
      method: "Email",
      email: listing.owner.email,
    });
  });

  it("includes the owner's phone when showContactInfo is true and method is Phone", () => {
    const owner = createUser({ phoneNumber: "555-1234" });
    const listing = createListing({
      owner,
      preferredContactMethod: "Phone",
      showContactInfo: true,
    });

    const response = mapListingToResponse(listing);

    expect(response.publicContactInfo).toEqual({
      method: "Phone",
      phoneNumber: owner.phoneNumber,
    });
  });
});
