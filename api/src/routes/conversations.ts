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

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const participantRepository = AppDataSource.getRepository(ConversationParticipant);
  const participants = await participantRepository.find({
    where: { user: { id: req.user!.id } },
    relations: { conversation: { participants: { user: true } } },
  });
  const conversations = participants.map((participant) => participant.conversation);
  return res.json(conversations);
});

router.post("/", validationMiddleware(ConversationDto), async (req: AuthenticatedRequest, res) => {
  const userRepository = AppDataSource.getRepository(User);
  const conversationRepository = AppDataSource.getRepository(Conversation);
  const participantRepository = AppDataSource.getRepository(ConversationParticipant);

  const participantIds = Array.from(new Set([...req.body.participantIds, req.user!.id]));
  const users = await userRepository.find({ where: { id: In(participantIds) } });
  if (users.length !== participantIds.length) {
    return res.status(404).json({ message: "One or more participants not found" });
  }

  const conversation = conversationRepository.create({ topic: req.body.topic });
  await conversationRepository.save(conversation);

  for (const user of users) {
    const participant = participantRepository.create({ conversation, user });
    await participantRepository.save(participant);
  }

  const created = await conversationRepository.findOne({
    where: { id: conversation.id },
    relations: { participants: { user: true } },
  });
  return res.status(201).json(created);
});

router.get("/:id/messages", async (req: AuthenticatedRequest, res) => {
  const conversationRepository = AppDataSource.getRepository(Conversation);
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
  const messages = await messageRepository.find({
    where: { conversation: { id: conversation.id } },
    order: { createdAt: "ASC" },
  });
  return res.json(messages);
});

router.post(
  "/:id/messages",
  validationMiddleware(ConversationMessageDto),
  async (req: AuthenticatedRequest, res) => {
    const conversationRepository = AppDataSource.getRepository(Conversation);
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
    return res.status(201).json(message);
  }
);

export default router;
