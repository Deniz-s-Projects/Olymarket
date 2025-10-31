import type {
  CommunityDiscussion,
  PaginatedResponse,
  CreateCommunityDiscussionPayload,
  CommunityComment,
  CreateCommunityCommentPayload,
} from '../types/community'
import { apiClient } from '../lib/apiClient'

export const communityDiscussionsService = {
  async getDiscussions(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<CommunityDiscussion>> {
    return apiClient<PaginatedResponse<CommunityDiscussion>>(
      '/community-discussions',
      {
        params,
      }
    )
  },

  async createDiscussion(
    payload: CreateCommunityDiscussionPayload
  ): Promise<CommunityDiscussion> {
    return apiClient<CommunityDiscussion>('/community-discussions', {
      method: 'POST',
      body: payload,
    })
  },

  async createComment(
    discussionId: string,
    payload: CreateCommunityCommentPayload
  ): Promise<CommunityComment> {
    return apiClient<CommunityComment>(
      `/community-discussions/${discussionId}/comments`,
      {
        method: 'POST',
        body: payload,
      }
    )
  },
}
