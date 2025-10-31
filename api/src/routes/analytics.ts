import { Router } from "express";
import { AppDataSource } from "../config";
import { Listing } from "../entities/Listing";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

const buildListingAnalytics = (data: {
  id: string;
  title: string;
  views: number;
  saves: number;
  createdAt: Date;
  updatedAt: Date;
}) => {
  const { id, title, views, saves, createdAt, updatedAt } = data;
  const conversionRate = views > 0 ? saves / views : 0;

  return {
    id,
    title,
    views,
    saves,
    conversionRate,
    createdAt,
    updatedAt,
  };
};

router.get("/listings", async (req: AuthenticatedRequest, res) => {
  const listingRepository = AppDataSource.getRepository(Listing);

  const baseQuery = listingRepository.createQueryBuilder("listing");

  if (req.user!.role !== "admin") {
    baseQuery.where("listing.owner_id = :ownerId", { ownerId: req.user!.id });
  }

  const listingRows = await baseQuery
    .clone()
    .select("listing.id", "id")
    .addSelect("listing.title", "title")
    .addSelect("listing.viewsCount", "views")
    .addSelect("listing.savesCount", "saves")
    .addSelect("listing.createdAt", "createdAt")
    .addSelect("listing.updatedAt", "updatedAt")
    .orderBy("listing.createdAt", "DESC")
    .getRawMany();

  const totalsRow = await baseQuery
    .clone()
    .select("COALESCE(SUM(listing.viewsCount), 0)", "views")
    .addSelect("COALESCE(SUM(listing.savesCount), 0)", "saves")
    .addSelect("COUNT(*)", "listingCount")
    .getRawOne();

  const listings = listingRows.map((row) =>
    buildListingAnalytics({
      id: row.id as string,
      title: row.title as string,
      views: Number(row.views ?? 0),
      saves: Number(row.saves ?? 0),
      createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
    }),
  );

  const totalViews = Number(totalsRow?.views ?? 0);
  const totalSaves = Number(totalsRow?.saves ?? 0);
  const listingCount = Number(totalsRow?.listingCount ?? listings.length);
  const conversionRate = totalViews > 0 ? totalSaves / totalViews : 0;

  return res.json({
    totals: {
      views: totalViews,
      saves: totalSaves,
      conversionRate,
      listingCount,
    },
    listings,
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

  return res.json(
    buildListingAnalytics({
      id: listing.id,
      title: listing.title,
      views: listing.viewsCount ?? 0,
      saves: listing.savesCount ?? 0,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    }),
  );
});

export default router;
