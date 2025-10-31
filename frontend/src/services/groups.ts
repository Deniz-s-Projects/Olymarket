import type {
  Group,
  GroupSummary,
  PaginatedResponse,
  CreateGroupPayload,
  UpdateGroupPayload,
  GroupEvent,
  CreateGroupEventPayload,
  UpdateGroupEventPayload,
  UpsertGroupEventRsvpPayload,
  GroupPost,
  CreateGroupPostPayload,
  UpdateGroupPostPayload,
  CreateGroupCommentPayload,
  GroupComment,
} from '../types/group'
import { apiClient } from '../lib/apiClient'

export const groupsService = {
  // Get all groups, optionally filtered by type
  async getGroups(params?: {
    type?: string
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<GroupSummary>> {
    return apiClient<PaginatedResponse<GroupSummary>>('/groups', {
      params,
    })
  },

  // Get a specific group by ID
  async getGroup(id: string): Promise<Group> {
    return apiClient<Group>(`/groups/${id}`)
  },

  // Create a new group
  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    return apiClient<Group>('/groups', {
      method: 'POST',
      body: payload,
    })
  },

  // Update a group
  async updateGroup(
    id: string,
    payload: UpdateGroupPayload
  ): Promise<Group> {
    return apiClient<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  // Delete a group
  async deleteGroup(id: string): Promise<void> {
    return apiClient<void>(`/groups/${id}`, {
      method: 'DELETE',
    })
  },

  // Join a group
  async joinGroup(id: string): Promise<Group> {
    return apiClient<Group>(`/groups/${id}/join`, {
      method: 'POST',
    })
  },

  // Leave a group
  async leaveGroup(id: string): Promise<Group> {
    return apiClient<Group>(`/groups/${id}/leave`, {
      method: 'POST',
    })
  },

  // Get user's groups
  async getMyGroups(params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<GroupSummary>> {
    return apiClient<PaginatedResponse<GroupSummary>>('/groups/my/groups', {
      params,
    })
  },

  async getGroupEvents(groupId: string): Promise<GroupEvent[]> {
    return apiClient<GroupEvent[]>(`/groups/${groupId}/events`)
  },

  async createGroupEvent(
    groupId: string,
    payload: CreateGroupEventPayload
  ): Promise<GroupEvent> {
    return apiClient<GroupEvent>(`/groups/${groupId}/events`, {
      method: 'POST',
      body: payload,
    })
  },

  async updateGroupEvent(
    groupId: string,
    eventId: string,
    payload: UpdateGroupEventPayload
  ): Promise<GroupEvent> {
    return apiClient<GroupEvent>(`/groups/${groupId}/events/${eventId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  async deleteGroupEvent(groupId: string, eventId: string): Promise<void> {
    return apiClient<void>(`/groups/${groupId}/events/${eventId}`, {
      method: 'DELETE',
    })
  },

  async rsvpToEvent(
    groupId: string,
    eventId: string,
    payload: UpsertGroupEventRsvpPayload
  ): Promise<GroupEvent> {
    return apiClient<GroupEvent>(`/groups/${groupId}/events/${eventId}/rsvp`, {
      method: 'POST',
      body: payload,
    })
  },

  async getGroupPosts(groupId: string): Promise<GroupPost[]> {
    return apiClient<GroupPost[]>(`/groups/${groupId}/posts`)
  },

  async createGroupPost(
    groupId: string,
    payload: CreateGroupPostPayload
  ): Promise<GroupPost | null> {
    return apiClient<GroupPost | null>(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: payload,
    })
  },

  async updateGroupPost(
    groupId: string,
    postId: string,
    payload: UpdateGroupPostPayload
  ): Promise<GroupPost | null> {
    return apiClient<GroupPost | null>(`/groups/${groupId}/posts/${postId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  async deleteGroupPost(groupId: string, postId: string): Promise<void> {
    return apiClient<void>(`/groups/${groupId}/posts/${postId}`, {
      method: 'DELETE',
    })
  },

  async createGroupComment(
    groupId: string,
    postId: string,
    payload: CreateGroupCommentPayload
  ): Promise<GroupComment> {
    return apiClient<GroupComment>(
      `/groups/${groupId}/posts/${postId}/comments`,
      {
        method: 'POST',
        body: payload,
      }
    )
  },
}
