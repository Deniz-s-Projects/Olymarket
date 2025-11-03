import { Router } from "express";
import type { Request } from "express";
import type { SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../config";
import { WantedListing } from "../entities/WantedListing";
import { ListingCategory } from "../entities/ListingCategory";
import { Conversation } from "../entities/Conversation";
import { ConversationParticipant } from "../entities/ConversationParticipant";
import { Message } from "../entities/Message";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import {
  WantedListingCreateDto,
  WantedListingRespondDto,
  WantedListingUpdateDto,
  WANTED_LISTING_STATUSES,
} from "../dtos/wantedListing";
import { mapConversationSummaryToDto, mapWantedListingToResponse } from "../dtos/response/wantedListing";

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 10;

const parseNumberParam = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const normalizeStatus = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return WANTED_LISTING_STATUSES.find((status) => status === normalized);
};

const buildWantedListingsQuery = (
  req: Request,
): { query: SelectQueryBuilder<WantedListing>; page: number; limit: number } => {
  const repository = AppDataSource.getRepository(WantedListing);
  const query = repository
    .createQueryBuilder("wanted")
    .leftJoinAndSelect("wanted.buyer", "buyer")
    .leftJoinAndSelect("wanted.category", "category")
    .leftJoinAndSelect("wanted.fulfillingSeller", "fulfillingSeller")
    .leftJoinAndSelect("wanted.conversation", "conversation")
    .orderBy("wanted.createdAt", "DESC");

  const searchTerm = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (searchTerm) {
    query.andWhere("(wanted.title ILIKE :term OR wanted.details ILIKE :term)", {
      term: `%${searchTerm}%`,
    });
  }

  const categoryName = typeof req.query.category === "string" ? req.query.category.trim() : "";
  if (categoryName) {
    query.andWhere("LOWER(category.name) = :categoryName", {
      categoryName: categoryName.toLowerCase(),
    });
  }

  const status = normalizeStatus(req.query.status);
  if (status) {
    query.andWhere("wanted.status = :status", { status });
  }

  const minBudget = parseNumberParam(req.query.minBudget);
  if (typeof minBudget === "number") {
    query.andWhere("wanted.budget >= :minBudget", { minBudget });
  }

  const maxBudget = parseNumberParam(req.query.maxBudget);
  if (typeof maxBudget === "number") {
    query.andWhere("wanted.budget <= :maxBudget", { maxBudget });
  }

  const rawPage = parseNumberParam(req.query.page);
  const page = rawPage && rawPage > 0 ? Math.floor(rawPage) : 1;

  const rawLimit = parseNumberParam(req.query.limit);
  const limitCandidate = rawLimit && rawLimit > 0 ? Math.floor(rawLimit) : DEFAULT_PAGE_SIZE;
  const limit = Math.min(limitCandidate, MAX_PAGE_SIZE);

  query.skip((page - 1) * limit).take(limit);

  return { query, page, limit };
};

const router = Router();

router.get("/", async (req, res) => {
  const { query, page, limit } = buildWantedListingsQuery(req);
  const [results, total] = await query.getManyAndCount();
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return res.json({
    data: results.map((item) => mapWantedListingToResponse(item)),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasMore: totalPages > 0 && page < totalPages,
    },
  });
});

router.get("/:id", async (req, res) => {
  const repository = AppDataSource.getRepository(WantedListing);
  const record = await repository.findOne({
    where: { id: req.params.id },
    relations: {
      buyer: true,
      category: true,
      fulfillingSeller: true,
      conversation: true,
    },
  });

  if (!record) {
    return res.status(404).json({ message: "Buyer request not found" });
  }

  return res.json(mapWantedListingToResponse(record));
});

router.post(
  "/",
  authMiddleware,
  validationMiddleware(WantedListingCreateDto),
  async (req: AuthenticatedRequest, res) => {
    const repository = AppDataSource.getRepository(WantedListing);
    const categoryRepository = AppDataSource.getRepository(ListingCategory);

    let category: ListingCategory | null = null;
    if (req.body.categoryId) {
      category = await categoryRepository.findOne({ where: { id: req.body.categoryId } });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    const title = req.body.title.trim();
    const details = typeof req.body.details === "string" ? req.body.details.trim() : "";

    const wanted = repository.create({
      title,
      details: details || null,
      budget: req.body.budget,
      buyer: req.user!,
      category,
      status: "open",
      fulfilledAt: null,
      fulfillingSeller: null,
    });

    await repository.save(wanted);

    const created = await repository.findOne({
      where: { id: wanted.id },
      relations: {
        buyer: true,
        category: true,
        fulfillingSeller: true,
        conversation: true,
      },
    });

    if (!created) {
      return res.status(500).json({ message: "Failed to load created request" });
    }

    return res.status(201).json(mapWantedListingToResponse(created));
  },
);

router.put(
  "/:id",
  authMiddleware,
  validationMiddleware(WantedListingUpdateDto),
  async (req: AuthenticatedRequest, res) => {
    const repository = AppDataSource.getRepository(WantedListing);
    const categoryRepository = AppDataSource.getRepository(ListingCategory);

    const record = await repository.findOne({
      where: { id: req.params.id },
      relations: {
        buyer: true,
        category: true,
        fulfillingSeller: true,
        conversation: true,
      },
    });

    if (!record) {
      return res.status(404).json({ message: "Buyer request not found" });
    }

    const isOwner = record.buyer.id === req.user!.id;
    const isAdmin = req.user!.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to update this request" });
    }

    if (typeof req.body.title === "string") {
      record.title = req.body.title.trim();
    }

    if (typeof req.body.details === "string") {
      const trimmedDetails = req.body.details.trim();
      record.details = trimmedDetails || null;
    }

    if (typeof req.body.budget === "string") {
      record.budget = req.body.budget;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "categoryId")) {
      if (typeof req.body.categoryId === "string" && req.body.categoryId.trim().length > 0) {
        const category = await categoryRepository.findOne({ where: { id: req.body.categoryId } });
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        record.category = category;
      } else {
        record.category = null;
      }
    }

    if (typeof req.body.status === "string") {
      record.status = req.body.status;
      if (record.status === "fulfilled") {
        record.fulfilledAt = new Date();
      } else if (record.status === "open") {
        record.fulfilledAt = null;
        record.fulfillingSeller = null;
      }
    }

    await repository.save(record);

    const updated = await repository.findOne({
      where: { id: record.id },
      relations: {
        buyer: true,
        category: true,
        fulfillingSeller: true,
        conversation: true,
      },
    });

    if (!updated) {
      return res.status(500).json({ message: "Failed to load updated request" });
    }

    return res.json(mapWantedListingToResponse(updated));
  },
);

router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const repository = AppDataSource.getRepository(WantedListing);
  const record = await repository.findOne({
    where: { id: req.params.id },
    relations: { buyer: true },
  });

  if (!record) {
    return res.status(404).json({ message: "Buyer request not found" });
  }

  const isOwner = record.buyer.id === req.user!.id;
  const isAdmin = req.user!.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not allowed to delete this request" });
  }

  await repository.remove(record);
  return res.status(204).send();
});

router.post(
  "/:id/respond",
  authMiddleware,
  validationMiddleware(WantedListingRespondDto),
  async (req: AuthenticatedRequest, res) => {
    const repository = AppDataSource.getRepository(WantedListing);
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const participantRepository = AppDataSource.getRepository(ConversationParticipant);
    const messageRepository = AppDataSource.getRepository(Message);

    const record = await repository.findOne({
      where: { id: req.params.id },
      relations: {
        buyer: true,
        category: true,
        fulfillingSeller: true,
        conversation: true,
      },
    });

    if (!record) {
      return res.status(404).json({ message: "Buyer request not found" });
    }

    if (record.buyer.id === req.user!.id) {
      return res.status(400).json({ message: "You cannot respond to your own request" });
    }

    if (record.status === "cancelled" || record.status === "fulfilled") {
      return res.status(400).json({ message: "This request is not accepting new responses" });
    }

    let conversation = record.conversation;
    let createdConversation = false;

    if (!conversation) {
      const topicBase = record.title.trim() || "Buyer request";
      const topic = topicBase.length > 140 ? `${topicBase.slice(0, 137)}...` : topicBase;
      conversation = conversationRepository.create({ topic });
      await conversationRepository.save(conversation);
      const buyerParticipant = participantRepository.create({
        conversation,
        user: record.buyer,
      });
      const sellerParticipant = participantRepository.create({
        conversation,
        user: req.user!,
      });
      await participantRepository.save(buyerParticipant);
      await participantRepository.save(sellerParticipant);
      createdConversation = true;
    } else {
      const existingSellerParticipant = await participantRepository.findOne({
        where: { conversation: { id: conversation.id }, user: { id: req.user!.id } },
      });

      if (!existingSellerParticipant) {
        const sellerParticipant = participantRepository.create({
          conversation,
          user: req.user!,
        });
        await participantRepository.save(sellerParticipant);
      }
    }

    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (message.length > 0) {
      const createdMessage = messageRepository.create({
        body: message,
        conversation,
        sender: req.user!,
      });
      await messageRepository.save(createdMessage);
    }

    record.conversation = conversation;
    record.fulfillingSeller = req.user!;
    if (req.body.markFulfilled) {
      record.status = "fulfilled";
      record.fulfilledAt = new Date();
    } else if (record.status === "open") {
      record.status = "matched";
      record.fulfilledAt = null;
    }

    await repository.save(record);

    const [updatedListing, hydratedConversation] = await Promise.all([
      repository.findOne({
        where: { id: record.id },
        relations: {
          buyer: true,
          category: true,
          fulfillingSeller: true,
          conversation: true,
        },
      }),
      conversationRepository.findOne({
        where: { id: conversation.id },
        relations: { participants: { user: true } },
      }),
    ]);

    if (!updatedListing) {
      return res.status(500).json({ message: "Failed to load updated request" });
    }

    const conversationSummary = hydratedConversation
      ? mapConversationSummaryToDto(hydratedConversation, hydratedConversation.participants)
      : null;

    return res.json({
      listing: mapWantedListingToResponse(updatedListing),
      conversation: conversationSummary,
      createdConversation,
    });
  },
);

export default router;
