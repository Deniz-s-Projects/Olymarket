import type { Group, CreateGroupPayload, UpdateGroupPayload } from '../types/group'

const API_BASE = 'http://localhost:3000'

export const groupsService = {
  // Get all groups, optionally filtered by type
  async getGroups(type?: string): Promise<Group[]> {
    const url = type ? `${API_BASE}/groups?type=${type}` : `${API_BASE}/groups`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch groups')
    }
    return response.json()
  },

  // Get a specific group by ID
  async getGroup(id: string): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch group')
    }
    return response.json()
  },

  // Create a new group
  async createGroup(payload: CreateGroupPayload, token: string): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create group')
    }
    return response.json()
  },

  // Update a group
  async updateGroup(
    id: string,
    payload: UpdateGroupPayload,
    token: string
  ): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update group')
    }
    return response.json()
  },

  // Delete a group
  async deleteGroup(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete group')
    }
  },

  // Join a group
  async joinGroup(id: string, token: string): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups/${id}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to join group')
    }
    return response.json()
  },

  // Leave a group
  async leaveGroup(id: string, token: string): Promise<Group> {
    const response = await fetch(`${API_BASE}/groups/${id}/leave`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to leave group')
    }
    return response.json()
  },

  // Get user's groups
  async getMyGroups(token: string): Promise<Group[]> {
    const response = await fetch(`${API_BASE}/groups/my/groups`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch your groups')
    }
    return response.json()
  },
}
