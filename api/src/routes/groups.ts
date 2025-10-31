import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreateGroupEventDto,
  UpdateGroupEventDto,
  UpsertGroupEventRsvpDto,
  CreateGroupPostDto,
  UpdateGroupPostDto,
  CreateGroupCommentDto,
} from "../dtos/group";
import { AppDataSource } from "../config";
import { Group } from "../entities/Group";
import { GroupMember } from "../entities/GroupMember";
import { GroupEvent } from "../entities/GroupEvent";
import { GroupEventRsvp } from "../entities/GroupEventRsvp";
import { GroupPost } from "../entities/GroupPost";
import { GroupComment } from "../entities/GroupComment";

const router = Router();

type GroupContext = {
  group: Group;
  membership: GroupMember | null;
  isOwner: boolean;
  isModerator: boolean;
};

async function resolveGroupContext(
  groupId: string,
  userId: string
): Promise<GroupContext | null> {
  const groupRepository = AppDataSource.getRepository(Group);
  const group = await groupRepository.findOne({
    where: { id: groupId },
    relations: ["owner"],
  });

  if (!group) {
    return null;
  }

  const groupMemberRepository = AppDataSource.getRepository(GroupMember);
  const membership = await groupMemberRepository.findOne({
    where: { group: { id: group.id }, user: { id: userId } },
  });

  const isOwner = group.owner.id === userId;
  const isModerator = isOwner || membership?.role === "moderator";

  return {
    group,
    membership: membership ?? null,
    isOwner,
    isModerator,
  };
}

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

// Group events --------------------------------------------------------------
router.get(
  "/:id/events",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(req.params.id, req.user!.id);

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.membership && !context.isOwner) {
      return res
        .status(403)
        .json({ message: "You must join the group to view events" });
    }

    const eventRepository = AppDataSource.getRepository(GroupEvent);
    const events = await eventRepository
      .createQueryBuilder("event")
      .leftJoinAndSelect("event.creator", "creator")
      .leftJoinAndSelect("event.rsvps", "rsvp")
      .leftJoinAndSelect("rsvp.user", "rsvpUser")
      .where("event.group_id = :groupId", { groupId: context.group.id })
      .orderBy("event.start_at", "ASC")
      .getMany();

    return res.json(events);
  }
);

router.post(
  "/:id/events",
  authMiddleware,
  validationMiddleware(CreateGroupEventDto),
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(req.params.id, req.user!.id);

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.isModerator) {
      return res
        .status(403)
        .json({ message: "Only moderators can create events" });
    }

    const eventRepository = AppDataSource.getRepository(GroupEvent);
    const event = eventRepository.create({
      title: req.body.title,
      description: req.body.description ?? null,
      startAt: new Date(req.body.startAt),
      endAt: req.body.endAt ? new Date(req.body.endAt) : null,
      location: req.body.location ?? null,
      isAllDay: req.body.isAllDay ?? false,
      rsvpDeadline: req.body.rsvpDeadline
        ? new Date(req.body.rsvpDeadline)
        : null,
      group: context.group,
      creator: req.user!,
    });

    await eventRepository.save(event);

    const createdEvent = await eventRepository.findOne({
      where: { id: event.id },
      relations: ["creator", "rsvps", "rsvps.user"],
    });

    return res.status(201).json(createdEvent);
  }
);

router.put(
  "/:groupId/events/:eventId",
  authMiddleware,
  validationMiddleware(UpdateGroupEventDto),
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(
      req.params.groupId,
      req.user!.id
    );

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.isModerator) {
      return res
        .status(403)
        .json({ message: "Only moderators can update events" });
    }

    const eventRepository = AppDataSource.getRepository(GroupEvent);
    const event = await eventRepository.findOne({
      where: { id: req.params.eventId, group: { id: context.group.id } },
      relations: ["creator"],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (req.body.title !== undefined) {
      event.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      event.description = req.body.description ?? null;
    }
    if (req.body.startAt !== undefined) {
      event.startAt = new Date(req.body.startAt);
    }
    if (req.body.endAt !== undefined) {
      event.endAt = req.body.endAt ? new Date(req.body.endAt) : null;
    }
    if (req.body.location !== undefined) {
      event.location = req.body.location ?? null;
    }
    if (typeof req.body.isAllDay === "boolean") {
      event.isAllDay = req.body.isAllDay;
    }
    if (req.body.rsvpDeadline !== undefined) {
      event.rsvpDeadline = req.body.rsvpDeadline
        ? new Date(req.body.rsvpDeadline)
        : null;
    }

    await eventRepository.save(event);

    const updatedEvent = await eventRepository.findOne({
      where: { id: event.id },
      relations: ["creator", "rsvps", "rsvps.user"],
    });

    return res.json(updatedEvent);
  }
);

router.delete(
  "/:groupId/events/:eventId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(
      req.params.groupId,
      req.user!.id
    );

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.isModerator) {
      return res
        .status(403)
        .json({ message: "Only moderators can delete events" });
    }

    const eventRepository = AppDataSource.getRepository(GroupEvent);
    const event = await eventRepository.findOne({
      where: { id: req.params.eventId, group: { id: context.group.id } },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await eventRepository.remove(event);
    return res.status(204).send();
  }
);

router.post(
  "/:groupId/events/:eventId/rsvp",
  authMiddleware,
  validationMiddleware(UpsertGroupEventRsvpDto),
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(
      req.params.groupId,
      req.user!.id
    );

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.membership && !context.isOwner) {
      return res
        .status(403)
        .json({ message: "You must be a member to RSVP" });
    }

    const eventRepository = AppDataSource.getRepository(GroupEvent);
    const event = await eventRepository.findOne({
      where: { id: req.params.eventId, group: { id: context.group.id } },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const rsvpRepository = AppDataSource.getRepository(GroupEventRsvp);
    let rsvp = await rsvpRepository.findOne({
      where: { event: { id: event.id }, user: { id: req.user!.id } },
    });

    if (rsvp) {
      rsvp.status = req.body.status;
      rsvp.reminderSentAt = null;
    } else {
      rsvp = rsvpRepository.create({
        event,
        user: req.user!,
        status: req.body.status,
        reminderSentAt: null,
      });
    }

    await rsvpRepository.save(rsvp);

    const updatedEvent = await eventRepository.findOne({
      where: { id: event.id },
      relations: ["creator", "rsvps", "rsvps.user"],
    });

    return res.json(updatedEvent);
  }
);

// Group discussions ---------------------------------------------------------
router.get(
  "/:id/posts",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(req.params.id, req.user!.id);

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.membership && !context.isOwner) {
      return res
        .status(403)
        .json({ message: "You must join the group to view discussions" });
    }

    const postRepository = AppDataSource.getRepository(GroupPost);
    const posts = await postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.event", "event")
      .leftJoinAndSelect("post.comments", "comment")
      .leftJoinAndSelect("comment.author", "commentAuthor")
      .where("post.group_id = :groupId", { groupId: context.group.id })
      .orderBy("post.is_pinned", "DESC")
      .addOrderBy("post.created_at", "DESC")
      .addOrderBy("comment.created_at", "ASC")
      .getMany();

    return res.json(posts);
  }
);

router.post(
  "/:id/posts",
  authMiddleware,
  validationMiddleware(CreateGroupPostDto),
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(req.params.id, req.user!.id);

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.membership && !context.isOwner) {
      return res
        .status(403)
        .json({ message: "You must join the group to post" });
    }

    const postRepository = AppDataSource.getRepository(GroupPost);
    let event: GroupEvent | null = null;

    if (req.body.eventId) {
      const eventRepository = AppDataSource.getRepository(GroupEvent);
      event = await eventRepository.findOne({
        where: { id: req.body.eventId, group: { id: context.group.id } },
      });

      if (!event) {
        return res
          .status(400)
          .json({ message: "Event not found for this group" });
      }
    }

    const post = postRepository.create({
      title: req.body.title ?? null,
      body: req.body.body,
      isPinned:
        context.isModerator && typeof req.body.isPinned === "boolean"
          ? req.body.isPinned
          : false,
      isArchived:
        context.isModerator && typeof req.body.isArchived === "boolean"
          ? req.body.isArchived
          : false,
      group: context.group,
      author: req.user!,
      event,
    });

    await postRepository.save(post);

    const createdPost = await postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.event", "event")
      .leftJoinAndSelect("post.comments", "comment")
      .leftJoinAndSelect("comment.author", "commentAuthor")
      .where("post.id = :postId", { postId: post.id })
      .orderBy("comment.created_at", "ASC")
      .getOne();

    return res.status(201).json(createdPost);
  }
);

router.put(
  "/:groupId/posts/:postId",
  authMiddleware,
  validationMiddleware(UpdateGroupPostDto),
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(
      req.params.groupId,
      req.user!.id
    );

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    const postRepository = AppDataSource.getRepository(GroupPost);
    const post = await postRepository.findOne({
      where: { id: req.params.postId },
      relations: ["group", "author", "event"],
    });

    if (!post || post.group.id !== context.group.id) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isAuthor = post.author.id === req.user!.id;

    if (!context.isModerator && !isAuthor) {
      return res
        .status(403)
        .json({ message: "You do not have permission to edit this post" });
    }

    if (req.body.title !== undefined) {
      post.title = req.body.title ?? null;
    }

    if (req.body.body !== undefined) {
      post.body = req.body.body;
    }

    if (req.body.eventId !== undefined && context.isModerator) {
      if (!req.body.eventId) {
        post.event = null;
      } else {
        const eventRepository = AppDataSource.getRepository(GroupEvent);
        const event = await eventRepository.findOne({
          where: { id: req.body.eventId, group: { id: context.group.id } },
        });

        if (!event) {
          return res
            .status(400)
            .json({ message: "Event not found for this group" });
        }

        post.event = event;
      }
    }

    if (typeof req.body.isPinned === "boolean") {
      if (!context.isModerator) {
        return res
          .status(403)
          .json({ message: "Only moderators can pin posts" });
      }
      post.isPinned = req.body.isPinned;
    }

    if (typeof req.body.isArchived === "boolean") {
      if (!context.isModerator) {
        return res
          .status(403)
          .json({ message: "Only moderators can archive posts" });
      }
      post.isArchived = req.body.isArchived;
    }

    await postRepository.save(post);

    const updatedPost = await postRepository
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.event", "event")
      .leftJoinAndSelect("post.comments", "comment")
      .leftJoinAndSelect("comment.author", "commentAuthor")
      .where("post.id = :postId", { postId: post.id })
      .orderBy("comment.created_at", "ASC")
      .getOne();

    return res.json(updatedPost);
  }
);

router.delete(
  "/:groupId/posts/:postId",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(
      req.params.groupId,
      req.user!.id
    );

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    const postRepository = AppDataSource.getRepository(GroupPost);
    const post = await postRepository.findOne({
      where: { id: req.params.postId },
      relations: ["group", "author"],
    });

    if (!post || post.group.id !== context.group.id) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isAuthor = post.author.id === req.user!.id;

    if (!context.isModerator && !isAuthor) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this post" });
    }

    await postRepository.remove(post);
    return res.status(204).send();
  }
);

router.post(
  "/:groupId/posts/:postId/comments",
  authMiddleware,
  validationMiddleware(CreateGroupCommentDto),
  async (req: AuthenticatedRequest, res) => {
    const context = await resolveGroupContext(
      req.params.groupId,
      req.user!.id
    );

    if (!context) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!context.membership && !context.isOwner) {
      return res
        .status(403)
        .json({ message: "You must join the group to comment" });
    }

    const postRepository = AppDataSource.getRepository(GroupPost);
    const post = await postRepository.findOne({
      where: { id: req.params.postId },
      relations: ["group"],
    });

    if (!post || post.group.id !== context.group.id) {
      return res.status(404).json({ message: "Post not found" });
    }

    const commentRepository = AppDataSource.getRepository(GroupComment);
    const comment = commentRepository.create({
      body: req.body.body,
      post,
      author: req.user!,
    });

    await commentRepository.save(comment);

    const createdComment = await commentRepository.findOne({
      where: { id: comment.id },
      relations: ["author"],
    });

    return res.status(201).json(createdComment);
  }
);

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
