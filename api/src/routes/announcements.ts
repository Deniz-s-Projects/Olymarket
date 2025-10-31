import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, AuthenticatedRequest, requireAdmin } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  AnnouncementAudienceDto,
} from "../dtos/announcements";
import { Announcement } from "../entities/Announcement";
import { AnnouncementAudience } from "../entities/AnnouncementAudience";
import { UserPreference } from "../entities/UserPreference";

const router = Router();

const mapAnnouncement = (announcement: Announcement) => ({
  id: announcement.id,
  title: announcement.title,
  body: announcement.body,
  publishFrom: announcement.publishFrom.toISOString(),
  publishTo: announcement.publishTo ? announcement.publishTo.toISOString() : null,
  isPinned: announcement.isPinned,
  createdAt: announcement.createdAt.toISOString(),
  updatedAt: announcement.updatedAt.toISOString(),
  audiences: (announcement.audiences ?? []).map((audience) => ({
    id: audience.id,
    type: audience.type,
    value: audience.value,
  })),
});

const applyAnnouncementPayload = (
  announcement: Announcement,
  payload: CreateAnnouncementDto | UpdateAnnouncementDto,
  audiencesRepository = AppDataSource.getRepository(AnnouncementAudience)
) => {
  if (typeof payload.title === "string") {
    announcement.title = payload.title.trim();
  }

  if (typeof payload.body === "string") {
    announcement.body = payload.body.trim();
  }

  if (typeof payload.publishFrom === "string") {
    announcement.publishFrom = new Date(payload.publishFrom);
  }

  if (typeof payload.publishTo === "string") {
    announcement.publishTo = payload.publishTo ? new Date(payload.publishTo) : null;
  } else if (payload.publishTo === null) {
    announcement.publishTo = null;
  }

  if (typeof payload.isPinned === "boolean") {
    announcement.isPinned = payload.isPinned;
  }

  if (Array.isArray(payload.audiences)) {
    announcement.audiences = payload.audiences.map((audience: AnnouncementAudienceDto) =>
      audiencesRepository.create({
        type: audience.type.trim(),
        value: typeof audience.value === "string" ? audience.value.trim() : null,
      })
    );
  }

  return announcement;
};

router.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const announcementRepository = AppDataSource.getRepository(Announcement);
  const preferenceRepository = AppDataSource.getRepository(UserPreference);

  const now = new Date();

  const query = announcementRepository
    .createQueryBuilder("announcement")
    .leftJoinAndSelect("announcement.audiences", "audience")
    .where("announcement.publish_from <= :now", { now })
    .orderBy("announcement.is_pinned", "DESC")
    .addOrderBy("announcement.publish_from", "DESC")
    .addOrderBy("announcement.created_at", "DESC")
    .limit(100);

  const announcements = await query.getMany();

  const preferences = await preferenceRepository.findOne({
    where: { user: { id: req.user!.id } },
  });

  return res.json({
    data: announcements.map((announcement) => mapAnnouncement(announcement)),
    meta: {
      communityNewsEnabled: Boolean(preferences?.communityNews ?? false),
    },
  });
});

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validationMiddleware(CreateAnnouncementDto),
  async (req: AuthenticatedRequest, res) => {
    const announcementRepository = AppDataSource.getRepository(Announcement);
    const audienceRepository = AppDataSource.getRepository(AnnouncementAudience);

    const payload = req.body as CreateAnnouncementDto;

    const announcement = applyAnnouncementPayload(
      announcementRepository.create({
        publishTo: null,
        isPinned: false,
        audiences: [],
      }),
      payload,
      audienceRepository
    );

    await announcementRepository.save(announcement);

    const createdAnnouncement = await announcementRepository.findOne({
      where: { id: announcement.id },
      relations: ["audiences"],
    });

    return res.status(201).json(mapAnnouncement(createdAnnouncement!));
  }
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validationMiddleware(UpdateAnnouncementDto),
  async (req: AuthenticatedRequest, res) => {
    const announcementRepository = AppDataSource.getRepository(Announcement);
    const audienceRepository = AppDataSource.getRepository(AnnouncementAudience);

    const announcement = await announcementRepository.findOne({
      where: { id: req.params.id },
      relations: ["audiences"],
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (Array.isArray(req.body.audiences)) {
      await audienceRepository.delete({ announcement: { id: announcement.id } });
      announcement.audiences = [];
    }

    const updatedAnnouncement = applyAnnouncementPayload(
      announcement,
      req.body as UpdateAnnouncementDto,
      audienceRepository
    );

    await announcementRepository.save(updatedAnnouncement);

    const savedAnnouncement = await announcementRepository.findOne({
      where: { id: announcement.id },
      relations: ["audiences"],
    });

    return res.json(mapAnnouncement(savedAnnouncement!));
  }
);

export default router;
