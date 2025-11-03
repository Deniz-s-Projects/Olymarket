import { Router } from "express";
import { In } from "typeorm";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { ConversationDto, ConversationMessageDto } from "../dtos/conversation";
import { AppDataSource } from "../config";
import { Conversation } from "../entities/Conversation";
import { ConversationParticipant } from "../entities/ConversationParticipant";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { mapConversationToDto, mapMessageToDto } from "../dtos/response/conversation";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const participantRepository = AppDataSource.getRepository(ConversationParticipant);
  const messageRepository = AppDataSource.getRepository(Message);
  const conversationRepository = AppDataSource.getRepository(Conversation);
  const userId = req.user!.id;
  const parsePositiveInt = (value: unknown, defaultValue: number) => {
    const parsed = Number.parseInt((value as string) ?? "", 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return defaultValue;
    }
    return parsed;
  };

  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  const page = parsePositiveInt(req.query.page, 1);
  const requestedLimit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  const baseQuery = participantRepository
    .createQueryBuilder("participant")
    .leftJoinAndSelect("participant.conversation", "conversation")
    .where("participant.user_id = :userId", { userId })
    .orderBy("conversation.updatedAt", "DESC")
    .addOrderBy("participant.id", "DESC");

  const totalItems = await baseQuery.clone().getCount();
  const participants = await baseQuery.clone().skip(skip).take(limit).getMany();

  const conversationIds = participants.map((participant) => participant.conversation.id);
  const unreadCounts: Record<string, number> = {};

  if (conversationIds.length > 0) {
    const unreadResults = await messageRepository
      .createQueryBuilder("message")
      .select("message.conversation_id", "conversationId")
      .addSelect(
        "SUM(CASE WHEN message.sender_id = :userId THEN 0 ELSE CASE WHEN participant.last_read_at IS NULL OR message.created_at > participant.last_read_at THEN 1 ELSE 0 END END)",
        "unreadCount",
      )
      .innerJoin(
        ConversationParticipant,
        "participant",
        "participant.conversation_id = message.conversation_id AND participant.user_id = :userId",
      )
      .where("message.conversation_id IN (:...conversationIds)", { conversationIds })
      .groupBy("message.conversation_id")
      .setParameter("userId", userId)
      .getRawMany();

    for (const result of unreadResults) {
      const count = Number(result.unreadCount);
      unreadCounts[result.conversationId] = Number.isNaN(count) ? 0 : count;
    }
  }

  const now = new Date();
  const participantIds = participants.map((participant) => participant.id);

  if (participantIds.length > 0) {
    await participantRepository
      .createQueryBuilder()
      .update(ConversationParticipant)
      .set({ lastReadAt: now })
      .where("id IN (:...participantIds)", { participantIds })
      .execute();
  }

  const conversations = conversationIds.length
    ? await conversationRepository.find({
        where: { id: In(conversationIds) },
        relations: { participants: { user: true } },
      })
    : [];

  const conversationMap = new Map(conversations.map((conversation) => [conversation.id, conversation]));
  const participantIdSet = new Set(participantIds);

  for (const conversation of conversationMap.values()) {
    for (const participant of conversation.participants) {
      if (participantIdSet.has(participant.id)) {
        participant.lastReadAt = now;
      }
    }
  }

  const serializedConversations = participants
    .map((participant) => {
      const conversation = conversationMap.get(participant.conversation.id);
      if (!conversation) {
        return null;
      }

      return mapConversationToDto(conversation, unreadCounts[conversation.id] ?? 0);
    })
    .filter((conversation): conversation is ReturnType<typeof mapConversationToDto> => conversation !== null);

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  return res.json({
    data: serializedConversations,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
});

router.post("/", validationMiddleware(ConversationDto), async (req: AuthenticatedRequest, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const conversationRepository = AppDataSource.getRepository(Conversation);

  const participantIds = Array.from(new Set([...req.body.participantIds, req.user!.id]));
  const users = await userRepository.find({ where: { id: In(participantIds) } });
  if (users.length !== participantIds.length) {
    return res.status(404).json({ message: "One or more participants not found" });
  }

  const conversation = await AppDataSource.transaction(async (manager) => {
    const transactionalConversationRepository = manager.getRepository(Conversation);
    const transactionalParticipantRepository = manager.getRepository(ConversationParticipant);

    const createdConversation = transactionalConversationRepository.create({ topic: req.body.topic });
    await transactionalConversationRepository.save(createdConversation);

    const participants = users.map((user) =>
      transactionalParticipantRepository.create({ conversation: createdConversation, user }),
    );

    if (participants.length > 0) {
      await transactionalParticipantRepository.insert(participants);
    }

    return createdConversation;
  });

  const created = await conversationRepository.findOne({
    where: { id: conversation.id },
    relations: { participants: { user: true } },
  });
  if (!created) {
    return res.status(500).json({ message: "Failed to load created conversation" });
  }

  return res.status(201).json(mapConversationToDto(created, 0));
});

router.get("/:id/messages", async (req: AuthenticatedRequest, res) => {
  const conversationRepository = AppDataSource.getRepository(Conversation);
  const participantRepository = AppDataSource.getRepository(ConversationParticipant);
  const conversation = await conversationRepository.findOne({
    where: { id: req.params.id },
    relations: { participants: { user: true } },
  });
  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const isParticipant = conversation.participants.some((p) => p.user.id === req.user!.id);
  if (!isParticipant) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const participant = conversation.participants.find((p) => p.user.id === req.user!.id);
  if (participant) {
    const now = new Date();
    await participantRepository.update(participant.id, { lastReadAt: now });
    participant.lastReadAt = now;
  }

  const messageRepository = AppDataSource.getRepository(Message);
  const messages = await messageRepository.find({
    where: { conversation: { id: conversation.id } },
    order: { createdAt: "ASC" },
  });
  return res.json(messages.map((message) => mapMessageToDto(message)));
});

router.patch("/:id/read", async (req: AuthenticatedRequest, res) => {
  const participantRepository = AppDataSource.getRepository(ConversationParticipant);
  const participant = await participantRepository.findOne({
    where: { conversation: { id: req.params.id }, user: { id: req.user!.id } },
  });

  if (!participant) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const now = new Date();
  await participantRepository.update(participant.id, { lastReadAt: now });

  return res.json({ lastReadAt: now.toISOString() });
});

router.post(
  "/:id/messages",
  validationMiddleware(ConversationMessageDto),
  async (req: AuthenticatedRequest, res) => {
    const conversationRepository = AppDataSource.getRepository(Conversation);
    const participantRepository = AppDataSource.getRepository(ConversationParticipant);
    const conversation = await conversationRepository.findOne({
      where: { id: req.params.id },
      relations: { participants: { user: true } },
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    const isParticipant = conversation.participants.some((p) => p.user.id === req.user!.id);
    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const messageRepository = AppDataSource.getRepository(Message);
    const message = messageRepository.create({
      body: req.body.body,
      conversation,
      sender: req.user!,
    });
    await messageRepository.save(message);
    const participant = conversation.participants.find((p) => p.user.id === req.user!.id);
    if (participant) {
      await participantRepository.update(participant.id, { lastReadAt: new Date() });
    }
    return res.status(201).json(mapMessageToDto(message));
  }
);

export default router;
