import { Router } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../config";
import { CommunityDiscussion } from "../entities/CommunityDiscussion";
import { CommunityComment } from "../entities/CommunityComment";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { validationMiddleware } from "../middleware/validate";
import {
  CreateCommunityCommentDto,
  CreateCommunityDiscussionDto,
} from "../dtos/communityDiscussion";
import { mapUserToPublicDto } from "../dtos/response/user";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: AuthenticatedRequest, res) => {
  const discussionRepository = AppDataSource.getRepository(CommunityDiscussion);
  const commentRepository = AppDataSource.getRepository(CommunityComment);

  const page = Math.max(parseInt((req.query.page as string) ?? "1", 10) || 1, 1);
  const limit = Math.max(
    Math.min(parseInt((req.query.limit as string) ?? "10", 10) || 10, 50),
    1,
  );
  const skip = (page - 1) * limit;

  const [discussions, total] = await discussionRepository.findAndCount({
    order: { createdAt: "DESC" },
    relations: ["author"],
    skip,
    take: limit,
  });

  const discussionIds = discussions.map((discussion) => discussion.id);
  const commentsByDiscussion = new Map<string, CommunityComment[]>();

  if (discussionIds.length > 0) {
    const comments = await commentRepository.find({
      where: { discussion: { id: In(discussionIds) } },
      relations: ["author", "discussion"],
      order: { createdAt: "ASC" },
    });

    comments.forEach((comment) => {
      const parentId = comment.discussion.id;
      const bucket = commentsByDiscussion.get(parentId) ?? [];
      bucket.push(comment);
      commentsByDiscussion.set(parentId, bucket);
    });
  }

  const data = discussions.map((discussion) => ({
    id: discussion.id,
    title: discussion.title,
    body: discussion.body,
    author: mapUserToPublicDto(discussion.author),
    comments: (commentsByDiscussion.get(discussion.id) ?? []).map((comment) => ({
      id: comment.id,
      body: comment.body,
      author: mapUserToPublicDto(comment.author),
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),
    createdAt: discussion.createdAt.toISOString(),
    updatedAt: discussion.updatedAt.toISOString(),
  }));

  return res.json({
    data,
    meta: {
      total,
      page,
      limit,
      pageCount: Math.ceil(total / limit),
      hasMore: skip + discussions.length < total,
    },
  });
});

router.post(
  "/",
  validationMiddleware(CreateCommunityDiscussionDto),
  async (req: AuthenticatedRequest, res) => {
    const dto = req.body as CreateCommunityDiscussionDto;
    const discussionRepository = AppDataSource.getRepository(CommunityDiscussion);

    const discussion = discussionRepository.create({
      title: dto.title,
      body: dto.body,
      author: req.user!,
    });

    await discussionRepository.save(discussion);

    const created = await discussionRepository.findOne({
      where: { id: discussion.id },
      relations: ["author"],
    });

    if (!created) {
      return res.status(500).json({ message: "Unable to create discussion" });
    }

    return res.status(201).json({
      id: created.id,
      title: created.title,
      body: created.body,
      author: mapUserToPublicDto(created.author),
      comments: [],
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  }
);

router.post(
  "/:id/comments",
  validationMiddleware(CreateCommunityCommentDto),
  async (req: AuthenticatedRequest, res) => {
    const dto = req.body as CreateCommunityCommentDto;
    const discussionRepository = AppDataSource.getRepository(CommunityDiscussion);
    const commentRepository = AppDataSource.getRepository(CommunityComment);

    const discussion = await discussionRepository.findOne({
      where: { id: req.params.id },
    });

    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const comment = commentRepository.create({
      body: dto.body,
      discussion,
      author: req.user!,
    });

    await commentRepository.save(comment);

    const created = await commentRepository.findOne({
      where: { id: comment.id },
      relations: ["author"],
    });

    if (!created) {
      return res.status(500).json({ message: "Unable to create comment" });
    }

    return res.status(201).json({
      id: created.id,
      body: created.body,
      author: mapUserToPublicDto(created.author),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    });
  }
);

export default router;
