import { LessThanOrEqual } from "typeorm";
import { AppDataSource } from "../config";
import { Listing } from "../entities/Listing";

export const LISTING_EXPIRY_DAYS = 30;
const EXPIRY_CHECK_INTERVAL_MS = 60 * 60 * 1000; // Hourly

export const getNextExpiryDate = (from: Date = new Date()): Date => {
  const next = new Date(from.getTime());
  next.setDate(next.getDate() + LISTING_EXPIRY_DAYS);
  return next;
};

export const expireStaleListings = async (): Promise<number> => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const now = new Date();

  const result = await listingRepository
    .createQueryBuilder()
    .update(Listing)
    .set({ status: "expired", isActive: false })
    .where({ status: "active" })
    .andWhere({ expiresAt: LessThanOrEqual(now) })
    .returning("id")
    .execute();

  return result.affected ?? 0;
};

export const scheduleListingExpiryJob = (): NodeJS.Timeout => {
  const runJob = async () => {
    try {
      const affected = await expireStaleListings();
      if (affected > 0) {
        console.log(`Expired ${affected} listing(s) that passed their renewal window.`);
      }
    } catch (error) {
      console.error("Failed to expire stale listings", error);
    }
  };

  void runJob();
  return setInterval(runJob, EXPIRY_CHECK_INTERVAL_MS);
};
