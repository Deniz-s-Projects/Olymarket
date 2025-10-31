export type AnnouncementAudience = {
  id: string
  type: string
  value: string | null
}

export type Announcement = {
  id: string
  title: string
  body: string
  publishFrom: string
  publishTo: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
  audiences: AnnouncementAudience[]
}

export type AnnouncementsResponse = {
  data: Announcement[]
  meta: {
    communityNewsEnabled: boolean
  }
}

export type AnnouncementAudienceInput = {
  type: string
  value?: string | null
}

export type CreateAnnouncementPayload = {
  title: string
  body: string
  publishFrom: string
  publishTo?: string | null
  isPinned?: boolean
  audiences?: AnnouncementAudienceInput[]
}

export type UpdateAnnouncementPayload = Partial<CreateAnnouncementPayload>
