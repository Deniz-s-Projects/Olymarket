import { Router } from "express";
import { AppDataSource } from "../config";
import { Listing } from "../entities/Listing";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

const formatListingAnalytics = (listing: Listing) => {
  const views = listing.viewsCount ?? 0;
  const saves = listing.savesCount ?? 0;
  const conversionRate = views > 0 ? saves / views : 0;

  return {
    id: listing.id,
    title: listing.title,
    views,
    saves,
    conversionRate,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
};

router.get("/listings", async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);

  const listings = await listingRepository.find({
    where:
      req.user!.role === "admin"
        ? undefined
        : {
            owner: { id: req.user!.id },
          },
    order: { createdAt: "DESC" },
  });

  const analytics = listings.map(formatListingAnalytics);
  const totals = analytics.reduce(
    (acc, item) => {
      acc.views += item.views;
      acc.saves += item.saves;
      return acc;
    },
    { views: 0, saves: 0 },
  );
  const conversionRate = totals.views > 0 ? totals.saves / totals.views : 0;

  return res.json({
    totals: {
      views: totals.views,
      saves: totals.saves,
      conversionRate,
      listingCount: analytics.length,
    },
    listings: analytics,
  });
});

router.get("/listings/:id", async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);
  const listing = await listingRepository.findOne({ where: { id: req.params.id } });

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (listing.owner.id !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ message: "Not allowed" });
  }

  return res.json(formatListingAnalytics(listing));
});

export default router;
