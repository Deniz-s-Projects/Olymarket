import { Router } from "express";
import { AppDataSource } from "../config";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { OfferCreateDto, OfferCounterDto } from "../dtos/offer";
import { Listing } from "../entities/Listing";
import { Offer } from "../entities/Offer";
import { OfferMessage } from "../entities/OfferMessage";
import { Conversation } from "../entities/Conversation";
import { ConversationParticipant } from "../entities/ConversationParticipant";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { mapUserToPublicDto } from "../dtos/response/user";

const router = Router();

const offerRepository = () => AppDataSource.getRepository(Offer);
const listingRepository = () => AppDataSource.getRepository(Listing);
const offerMessageRepository = () => AppDataSource.getRepository(OfferMessage);
const conversationRepository = () => AppDataSource.getRepository(Conversation);
const participantRepository = () => AppDataSource.getRepository(ConversationParticipant);
const messageRepository = () => AppDataSource.getRepository(Message);

const toCurrencyString = (value: number) => value.toFixed(2);

const serializeUser = (user: User | null) => {
  if (!user) {
    return null;
  }

  return mapUserToPublicDto(user);
};

const serializeOfferMessage = (message: OfferMessage) => ({
  id: message.id,
  body: message.body,
  amount: message.amount,
  type: message.type,
  createdAt: message.createdAt.toISOString(),
  updatedAt: message.updatedAt.toISOString(),
  sender: serializeUser(message.sender),
});

const serializeOffer = (offer: Offer, messages: OfferMessage[]) => ({
  id: offer.id,
  amount: offer.amount,
  status: offer.status,
  createdAt: offer.createdAt.toISOString(),
  updatedAt: offer.updatedAt.toISOString(),
  listing: {
    id: offer.listing.id,
    title: offer.listing.title,
  },
  buyer: serializeUser(offer.buyer)!,
  seller: serializeUser(offer.seller)!,
  lastActionBy: serializeUser(offer.lastActionBy),
  messages: messages.map(serializeOfferMessage),
});

const loadOfferWithMessages = async (offerId: string) => {
  const repository = offerRepository();
  const offer = await repository.findOne({
    where: { id: offerId },
    relations: {
      listing: true,
      buyer: true,
      seller: true,
      lastActionBy: true,
      conversation: true,
    },
  });

  if (!offer) {
    return null;
  }

  const messages = await offerMessageRepository().find({
    where: { offer: { id: offer.id } },
    order: { createdAt: "ASC" },
  });

  return { offer, messages };
};

const ensureOfferConversation = async (offer: Offer) => {
  if (offer.conversation) {
    return offer.conversation;
  }

  const conversationRepo = conversationRepository();
  const participantRepo = participantRepository();
  const repository = offerRepository();

  const conversation = conversationRepo.create({
    topic: `Offer for ${offer.listing.title}`,
  });
  await conversationRepo.save(conversation);

  const participants = [offer.buyer, offer.seller];
  for (const participant of participants) {
    const entity = participantRepo.create({ conversation, user: participant });
    await participantRepo.save(entity);
  }

  offer.conversation = conversation;
  await repository.save({ id: offer.id, conversation });

  return conversation;
};

const notifyParticipants = async (offer: Offer, actor: User | null, message: string) => {
  const conversation = await ensureOfferConversation(offer);
  const repo = messageRepository();

  const sender = actor ?? offer.seller ?? offer.buyer;
  if (!sender) {
    return;
  }

  const notification = repo.create({
    body: message,
    conversation,
    sender,
  });
  await repo.save(notification);
};

router.use(authMiddleware);

router.get("/listing/:listingId", async (req: AuthenticatedRequest, res) => {
  const { listingId } = req.params;
  const listing = await listingRepository().findOne({
    where: { id: listingId },
    relations: { owner: true },
  });

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const viewerRole = listing.owner?.id === req.user!.id ? "seller" : "buyer";

  const qb = offerRepository()
    .createQueryBuilder("offer")
    .leftJoinAndSelect("offer.buyer", "buyer")
    .leftJoinAndSelect("offer.seller", "seller")
    .leftJoinAndSelect("offer.listing", "listing")
    .leftJoinAndSelect("offer.lastActionBy", "lastActionBy")
    .leftJoinAndSelect("offer.messages", "messages")
    .leftJoinAndSelect("messages.sender", "messageSender")
    .where("offer.listing_id = :listingId", { listingId })
    .orderBy("offer.created_at", "DESC")
    .addOrderBy("messages.created_at", "ASC");

  if (viewerRole === "buyer") {
    qb.andWhere("offer.buyer_id = :buyerId", { buyerId: req.user!.id });
  }

  const offers = await qb.getMany();

  const serialized = offers.map((offer) => {
    const sortedMessages = [...offer.messages].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    return serializeOffer(offer, sortedMessages);
  });

  return res.json({ viewerRole, offers: serialized });
});

router.post("/", validationMiddleware(OfferCreateDto), async (req: AuthenticatedRequest, res) => {
  const listing = await listingRepository().findOne({
    where: { id: req.body.listingId },
    relations: { owner: true },
  });

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (!listing.owner) {
    return res.status(400).json({ message: "Listing does not have an owner" });
  }

  if (listing.owner.id === req.user!.id) {
    return res.status(400).json({ message: "You cannot make an offer on your own listing" });
  }

  if (!listing.isActive) {
    return res.status(400).json({ message: "This listing is not accepting offers" });
  }

  const existing = await offerRepository().findOne({
    where: {
      listing: { id: listing.id },
      buyer: { id: req.user!.id },
      status: "pending",
    },
  });

  if (existing) {
    return res.status(400).json({ message: "You already have a pending offer for this listing" });
  }

  const offer = offerRepository().create({
    listing,
    buyer: req.user!,
    seller: listing.owner,
    amount: toCurrencyString(req.body.amount),
    status: "pending",
    lastActionBy: req.user!,
  });
  await offerRepository().save(offer);

  const initialMessage = offerMessageRepository().create({
    offer,
    sender: req.user!,
    amount: offer.amount,
    type: "offer",
    body: req.body.message ?? null,
  });
  await offerMessageRepository().save(initialMessage);

  const loaded = await loadOfferWithMessages(offer.id);
  if (!loaded) {
    return res.status(500).json({ message: "Failed to load offer" });
  }

  await notifyParticipants(loaded.offer, req.user!, `${req.user!.name} submitted a new offer of €${req.body.amount.toFixed(2)}`);

  return res.status(201).json({ offer: serializeOffer(loaded.offer, loaded.messages) });
});

router.post("/:id/accept", async (req: AuthenticatedRequest, res) => {
  const loaded = await loadOfferWithMessages(req.params.id);
  if (!loaded) {
    return res.status(404).json({ message: "Offer not found" });
  }

  const { offer } = loaded;
  if (offer.seller.id !== req.user!.id) {
    return res.status(403).json({ message: "Only the seller can accept this offer" });
  }

  if (offer.status !== "pending") {
    return res.status(400).json({ message: "Only pending offers can be accepted" });
  }

  offer.status = "accepted";
  offer.lastActionBy = req.user!;
  await offerRepository().save(offer);

  const message = offerMessageRepository().create({
    offer,
    sender: req.user!,
    amount: offer.amount,
    type: "status",
    body: "Offer accepted",
  });
  await offerMessageRepository().save(message);

  const refreshed = await loadOfferWithMessages(offer.id);
  if (!refreshed) {
    return res.status(500).json({ message: "Failed to load updated offer" });
  }

  await notifyParticipants(refreshed.offer, req.user!, `${req.user!.name} accepted the offer for €${Number(refreshed.offer.amount).toFixed(2)}`);

  return res.json({ offer: serializeOffer(refreshed.offer, refreshed.messages) });
});

router.post("/:id/decline", async (req: AuthenticatedRequest, res) => {
  const loaded = await loadOfferWithMessages(req.params.id);
  if (!loaded) {
    return res.status(404).json({ message: "Offer not found" });
  }

  const { offer } = loaded;
  const actorId = req.user!.id;
  const isSeller = offer.seller.id === actorId;
  const isBuyer = offer.buyer.id === actorId;

  if (!isSeller && !isBuyer) {
    return res.status(403).json({ message: "You do not have permission to decline this offer" });
  }

  if (offer.status !== "pending") {
    return res.status(400).json({ message: "Only pending offers can be declined" });
  }

  offer.status = "declined";
  offer.lastActionBy = req.user!;
  await offerRepository().save(offer);

  const message = offerMessageRepository().create({
    offer,
    sender: req.user!,
    amount: offer.amount,
    type: "status",
    body: isSeller ? "Seller declined the offer" : "Buyer withdrew the offer",
  });
  await offerMessageRepository().save(message);

  const refreshed = await loadOfferWithMessages(offer.id);
  if (!refreshed) {
    return res.status(500).json({ message: "Failed to load updated offer" });
  }

  await notifyParticipants(
    refreshed.offer,
    req.user!,
    `${req.user!.name} declined the offer for €${Number(refreshed.offer.amount).toFixed(2)}`,
  );

  return res.json({ offer: serializeOffer(refreshed.offer, refreshed.messages) });
});

router.post(
  "/:id/counter",
  validationMiddleware(OfferCounterDto),
  async (req: AuthenticatedRequest, res) => {
    const loaded = await loadOfferWithMessages(req.params.id);
    if (!loaded) {
      return res.status(404).json({ message: "Offer not found" });
    }

    const { offer } = loaded;
    const actorId = req.user!.id;
    const isSeller = offer.seller.id === actorId;
    const isBuyer = offer.buyer.id === actorId;

    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: "You do not have permission to counter this offer" });
    }

    if (offer.status !== "pending") {
      return res.status(400).json({ message: "Only pending offers can be countered" });
    }

    if (offer.lastActionBy && offer.lastActionBy.id === actorId) {
      return res.status(400).json({ message: "Wait for the other party to respond before countering" });
    }

    offer.amount = toCurrencyString(req.body.amount);
    offer.lastActionBy = req.user!;
    await offerRepository().save(offer);

    const message = offerMessageRepository().create({
      offer,
      sender: req.user!,
      amount: offer.amount,
      type: "counter",
      body: req.body.message ?? null,
    });
    await offerMessageRepository().save(message);

    const refreshed = await loadOfferWithMessages(offer.id);
    if (!refreshed) {
      return res.status(500).json({ message: "Failed to load updated offer" });
    }

    await notifyParticipants(
      refreshed.offer,
      req.user!,
      `${req.user!.name} countered the offer with €${req.body.amount.toFixed(2)}`,
    );

    return res.json({ offer: serializeOffer(refreshed.offer, refreshed.messages) });
  },
);

export default router;
