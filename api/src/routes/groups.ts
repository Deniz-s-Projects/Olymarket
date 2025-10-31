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

  const page = Math.max(parseInt((req.query.page as string) ?? "1", 10) || 1, 1);
  const limit = Math.max(
    Math.min(parseInt((req.query.limit as string) ?? "12", 10) || 12, 100),
    1,
  );
  const skip = (page - 1) * limit;

  const query = groupRepository
    .createQueryBuilder("group")
    .leftJoinAndSelect("group.owner", "owner")
    .where("group.isActive = :isActive", { isActive: true })
    .loadRelationCountAndMap("group.memberCount", "group.members");

  if (type && ["hobby", "interest", "block"].includes(type)) {
    query.andWhere("group.type = :type", { type });
  }

  const [groups, total] = await query
    .orderBy("group.createdAt", "DESC")
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  const data = groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    type: group.type,
    isActive: group.isActive,
    owner: group.owner
      ? {
          id: group.owner.id,
          name: group.owner.name,
        }
      : null,
    memberCount: (group as Group & { memberCount?: number }).memberCount ?? 0,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  }));

  return res.json({
    data,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
      hasMore: skip + groups.length < total,
    },
  });
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

  const page = Math.max(parseInt((req.query.page as string) ?? "1", 10) || 1, 1);
  const limit = Math.max(
    Math.min(parseInt((req.query.limit as string) ?? "12", 10) || 12, 100),
    1,
  );
  const skip = (page - 1) * limit;

  const membershipQuery = groupMemberRepository
    .createQueryBuilder("membership")
    .innerJoinAndSelect("membership.group", "group")
    .leftJoinAndSelect("group.owner", "owner")
    .where("membership.user_id = :userId", { userId: req.user!.id })
    .loadRelationCountAndMap("group.memberCount", "group.members");

  const [memberships, total] = await membershipQuery
    .orderBy("group.createdAt", "DESC")
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  const data = memberships.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    type: membership.group.type,
    isActive: membership.group.isActive,
    owner: membership.group.owner
      ? {
          id: membership.group.owner.id,
          name: membership.group.owner.name,
        }
      : null,
    memberCount:
      (membership.group as Group & { memberCount?: number }).memberCount ?? 0,
    createdAt: membership.group.createdAt,
    updatedAt: membership.group.updatedAt,
    membershipRole: membership.role,
    isMember: true,
  }));

  return res.json({
    data,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
      hasMore: skip + memberships.length < total,
    },
  });
});

export default router;
