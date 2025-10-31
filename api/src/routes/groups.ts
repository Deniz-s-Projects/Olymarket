import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import { CreateGroupDto, UpdateGroupDto } from "../dtos/group";
import { AppDataSource } from "../config";
import { Group } from "../entities/Group";
import { GroupMember } from "../entities/GroupMember";
import { User } from "../entities/User";

const router = Router();

// Get all groups (public)
router.get("/", async (req, res) => {
  const groupRepository = AppDataSource.getRepository(Group);
  const type = req.query.type as string | undefined;
  
  const query = groupRepository
    .createQueryBuilder("group")
    .leftJoinAndSelect("group.owner", "owner")
    .leftJoinAndSelect("group.members", "members")
    .leftJoinAndSelect("members.user", "memberUser")
    .where("group.isActive = :isActive", { isActive: true });

  if (type && ["hobby", "interest", "block"].includes(type)) {
    query.andWhere("group.type = :type", { type });
  }

  const groups = await query.orderBy("group.createdAt", "DESC").getMany();
  return res.json(groups);
});

// Get a specific group (public)
router.get("/:id", async (req, res) => {
  const groupRepository = AppDataSource.getRepository(Group);
  const group = await groupRepository.findOne({
    where: { id: req.params.id },
    relations: ["owner", "members", "members.user"],
  });

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  return res.json(group);
});

// Create a new group (authenticated)
router.post("/", authMiddleware, validationMiddleware(CreateGroupDto), async (req: AuthenticatedRequest, res) => {
  const groupRepository = AppDataSource.getRepository(Group);
  const groupMemberRepository = AppDataSource.getRepository(GroupMember);

  const group = groupRepository.create({
    name: req.body.name,
    description: req.body.description,
    type: req.body.type,
    owner: req.user!,
  });

  await groupRepository.save(group);

  // Automatically add the owner as a moderator member
  const ownerMembership = groupMemberRepository.create({
    group,
    user: req.user!,
    role: "moderator",
  });
  await groupMemberRepository.save(ownerMembership);

  // Fetch the complete group with relations
  const createdGroup = await groupRepository.findOne({
    where: { id: group.id },
    relations: ["owner", "members", "members.user"],
  });

  return res.status(201).json(createdGroup);
});

// Update a group (owner or moderator only)
router.put("/:id", authMiddleware, validationMiddleware(UpdateGroupDto), async (req: AuthenticatedRequest, res) => {
  const groupRepository = AppDataSource.getRepository(Group);
  const groupMemberRepository = AppDataSource.getRepository(GroupMember);

  const group = await groupRepository.findOne({
    where: { id: req.params.id },
    relations: ["owner", "members", "members.user"],
  });

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // Check if user is owner or moderator
  const isOwner = group.owner.id === req.user!.id;
  const membership = await groupMemberRepository.findOne({
    where: { group: { id: group.id }, user: { id: req.user!.id } },
  });
  const isModerator = membership?.role === "moderator";

  if (!isOwner && !isModerator) {
    return res.status(403).json({ message: "Not authorized to update this group" });
  }

  // Update group fields
  if (req.body.name) group.name = req.body.name;
  if (req.body.description !== undefined) group.description = req.body.description;
  if (req.body.type) group.type = req.body.type;

  await groupRepository.save(group);

  const updatedGroup = await groupRepository.findOne({
    where: { id: group.id },
    relations: ["owner", "members", "members.user"],
  });

  return res.json(updatedGroup);
});

// Delete a group (owner only)
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const groupRepository = AppDataSource.getRepository(Group);

  const group = await groupRepository.findOne({
    where: { id: req.params.id },
    relations: ["owner"],
  });

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  if (group.owner.id !== req.user!.id) {
    return res.status(403).json({ message: "Only the group owner can delete the group" });
  }

  await groupRepository.remove(group);
  return res.status(204).send();
});

// Join a group (authenticated)
router.post("/:id/join", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const groupRepository = AppDataSource.getRepository(Group);
  const groupMemberRepository = AppDataSource.getRepository(GroupMember);

  const group = await groupRepository.findOne({
    where: { id: req.params.id },
    relations: ["owner"],
  });

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // Check if user is already a member
  const existingMembership = await groupMemberRepository.findOne({
    where: { group: { id: group.id }, user: { id: req.user!.id } },
  });

  if (existingMembership) {
    return res.status(400).json({ message: "Already a member of this group" });
  }

  const membership = groupMemberRepository.create({
    group,
    user: req.user!,
    role: "member",
  });

  await groupMemberRepository.save(membership);

  const updatedGroup = await groupRepository.findOne({
    where: { id: group.id },
    relations: ["owner", "members", "members.user"],
  });

  return res.status(201).json(updatedGroup);
});

// Leave a group (authenticated)
router.post("/:id/leave", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const groupRepository = AppDataSource.getRepository(Group);
  const groupMemberRepository = AppDataSource.getRepository(GroupMember);

  const group = await groupRepository.findOne({
    where: { id: req.params.id },
    relations: ["owner"],
  });

  if (!group) {
    return res.status(404).json({ message: "Group not found" });
  }

  // Owner cannot leave their own group
  if (group.owner.id === req.user!.id) {
    return res.status(400).json({ message: "Group owner cannot leave. Delete the group instead." });
  }

  const membership = await groupMemberRepository.findOne({
    where: { group: { id: group.id }, user: { id: req.user!.id } },
  });

  if (!membership) {
    return res.status(400).json({ message: "Not a member of this group" });
  }

  await groupMemberRepository.remove(membership);

  const updatedGroup = await groupRepository.findOne({
    where: { id: group.id },
    relations: ["owner", "members", "members.user"],
  });

  return res.json(updatedGroup);
});

// Get user's groups (authenticated)
router.get("/my/groups", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const groupMemberRepository = AppDataSource.getRepository(GroupMember);

  const memberships = await groupMemberRepository.find({
    where: { user: { id: req.user!.id } },
    relations: ["group", "group.owner", "group.members", "group.members.user"],
  });

  const groups = memberships.map((membership) => membership.group);
  return res.json(groups);
});

export default router;
