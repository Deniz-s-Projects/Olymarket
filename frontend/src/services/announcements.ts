import type {
  Announcement,
  AnnouncementsResponse,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '../types/announcements'
import { apiClient } from '../lib/apiClient'

export const announcementsService = {
  async getAnnouncements(): Promise<AnnouncementsResponse> {
    return apiClient<AnnouncementsResponse>('/announcements')
  },

  async createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
    return apiClient<Announcement>('/announcements', {
      method: 'POST',
      body: payload,
    })
  },

  async updateAnnouncement(
    id: string,
    payload: UpdateAnnouncementPayload
  ): Promise<Announcement> {
    return apiClient<Announcement>(`/announcements/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },
}
