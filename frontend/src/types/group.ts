export type GroupType = "hobby" | "interest" | "block"

export type GroupMemberRole = "member" | "moderator"

export type User = {
  id: string
  name: string
  email: string
}

export type GroupMember = {
  id: string
  role: GroupMemberRole
  joinedAt: string
  user: User
  createdAt: string
  updatedAt: string
}

export type Group = {
  id: string
  name: string
  description: string | null
  type: GroupType
  isActive: boolean
  owner: User
  members: GroupMember[]
  events?: GroupEvent[]
  posts?: GroupPost[]
  createdAt: string
  updatedAt: string
}

export type CreateGroupPayload = {
  name: string
  description?: string
  type: GroupType
}

export type UpdateGroupPayload = {
  name?: string
  description?: string
  type?: GroupType
}

export type GroupEventRsvpStatus = 'going' | 'maybe' | 'not_going'

export type GroupEventRsvp = {
  id: string
  status: GroupEventRsvpStatus
  user: User
  reminderSentAt: string | null
  createdAt: string
  updatedAt: string
}

export type GroupEvent = {
  id: string
  title: string
  description: string | null
  startAt: string
  endAt: string | null
  location: string | null
  isAllDay: boolean
  rsvpDeadline: string | null
  creator: User
  rsvps: GroupEventRsvp[]
  createdAt: string
  updatedAt: string
}

export type CreateGroupEventPayload = {
  title: string
  description?: string | null
  startAt: string
  endAt?: string | null
  location?: string | null
  isAllDay?: boolean
  rsvpDeadline?: string | null
}

export type UpdateGroupEventPayload = Partial<CreateGroupEventPayload>

export type UpsertGroupEventRsvpPayload = {
  status: GroupEventRsvpStatus
}

export type GroupComment = {
  id: string
  body: string
  author: User
  createdAt: string
  updatedAt: string
}

export type GroupPostEventSummary = Pick<GroupEvent, 'id' | 'title' | 'startAt'>

export type GroupPost = {
  id: string
  title: string | null
  body: string
  isPinned: boolean
  isArchived: boolean
  author: User
  event: GroupPostEventSummary | null
  comments: GroupComment[]
  createdAt: string
  updatedAt: string
}

export type CreateGroupPostPayload = {
  title?: string | null
  body: string
  eventId?: string | null
  isPinned?: boolean
  isArchived?: boolean
}

export type UpdateGroupPostPayload = Partial<CreateGroupPostPayload>

export type CreateGroupCommentPayload = {
  body: string
}
