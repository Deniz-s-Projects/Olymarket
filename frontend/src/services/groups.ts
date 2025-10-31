import type { Group, CreateGroupPayload, UpdateGroupPayload } from '../types/group'
import { apiClient } from '../lib/apiClient'

export const groupsService = {
  // Get all groups, optionally filtered by type
  async getGroups(type?: string): Promise<Group[]> {
    return apiClient<Group[]>('/groups', { params: type ? { type } : undefined })
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
  async getMyGroups(): Promise<Group[]> {
    return apiClient<Group[]>('/groups/my/groups')
  },
}
