import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, requireAdmin, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { ReportDto, AdminReportUpdateDto } from "../dtos/report";
import { Report } from "../entities/Report";
import { Listing } from "../entities/Listing";
import { User } from "../entities/User";

const router = Router();

// POST /reports - Create a new report (authenticated users only)
router.post(
  "/",
  authMiddleware,
  validationMiddleware(ReportDto),
  async (req: AuthenticatedRequest, res) => {
    const reportRepository = AppDataSource.getRepository(Report);
    const listingRepository = AppDataSource.getRepository(Listing);
    const userRepository = AppDataSource.getRepository(User);

    const { reportType, reason, description, reportedListingId, reportedUserId } = req.body;

    let reportedListing: Listing | null = null;
    let reportedUser: User | null = null;

    if (reportType === "listing") {
      if (!reportedListingId) {
        return res.status(400).json({ message: "reportedListingId is required for listing reports" });
      }
      reportedListing = await listingRepository.findOne({ where: { id: reportedListingId } });
      if (!reportedListing) {
        return res.status(404).json({ message: "Listing not found" });
      }
    } else if (reportType === "user") {
      if (!reportedUserId) {
        return res.status(400).json({ message: "reportedUserId is required for user reports" });
      }
      reportedUser = await userRepository.findOne({ where: { id: reportedUserId } });
      if (!reportedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      // Prevent self-reporting
      if (reportedUser.id === req.user!.id) {
        return res.status(400).json({ message: "Cannot report yourself" });
      }
    }

    const report = reportRepository.create({
      reportType,
      reason,
      description: description || null,
      status: "pending",
      reporter: req.user!,
      reportedListing,
      reportedUser,
    });

    await reportRepository.save(report);
    return res.status(201).json(report);
  }
);

// GET /reports/my - Get reports created by the current user
router.get("/my", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const reportRepository = AppDataSource.getRepository(Report);
  const reports = await reportRepository.find({
    where: { reporter: { id: req.user!.id } },
    order: { createdAt: "DESC" },
  });
  return res.json(reports);
});

// Admin routes - require authentication and admin role
router.use(authMiddleware, requireAdmin);

// GET /reports - Get all reports (admin only)
router.get("/", async (req, res) => {
  const status = (req.query.status as string) || undefined;
  const reportType = (req.query.reportType as string) || undefined;
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const offset = (page - 1) * limit;

  const reportRepository = AppDataSource.getRepository(Report);
  const qb = reportRepository
    .createQueryBuilder("report")
    .leftJoinAndSelect("report.reporter", "reporter")
    .leftJoinAndSelect("report.reportedUser", "reportedUser")
    .leftJoinAndSelect("report.reportedListing", "reportedListing")
    .leftJoinAndSelect("reportedListing.owner", "listingOwner")
    .leftJoinAndSelect("report.reviewedBy", "reviewedBy")
    .orderBy("report.createdAt", "DESC")
    .skip(offset)
    .take(limit);

  if (status) {
    qb.andWhere("report.status = :status", { status });
  }
  if (reportType) {
    qb.andWhere("report.report_type = :reportType", { reportType });
  }

  const [items, total] = await qb.getManyAndCount();
  return res.json({ items, total, page, limit });
});

// GET /reports/:id - Get a specific report (admin only)
router.get("/:id", async (req, res) => {
  const reportRepository = AppDataSource.getRepository(Report);
  const report = await reportRepository.findOne({
    where: { id: req.params.id },
  });

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  return res.json(report);
});

// PATCH /reports/:id - Update a report (admin only)
router.patch(
  "/:id",
  validationMiddleware(AdminReportUpdateDto),
  async (req: AuthenticatedRequest, res) => {
    const reportRepository = AppDataSource.getRepository(Report);
    const report = await reportRepository.findOne({ where: { id: req.params.id } });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (req.body.status) {
      report.status = req.body.status;
      report.reviewedBy = req.user!;

      // Set resolvedAt when status changes to resolved or dismissed
      if (
        (req.body.status === "resolved" || req.body.status === "dismissed") &&
        !report.resolvedAt
      ) {
        report.resolvedAt = new Date();
      }
    }

    if (req.body.resolutionNotes !== undefined) {
      report.resolutionNotes = req.body.resolutionNotes;
    }

    const saved = await reportRepository.save(report);
    return res.json(saved);
  }
);

// DELETE /reports/:id - Delete a report (admin only)
router.delete("/:id", async (req, res) => {
  const reportRepository = AppDataSource.getRepository(Report);
  const report = await reportRepository.findOne({ where: { id: req.params.id } });

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  await reportRepository.remove(report);
  return res.status(204).send();
});

export default router;
