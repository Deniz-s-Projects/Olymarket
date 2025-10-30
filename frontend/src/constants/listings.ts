export const CONTACT_OPTIONS = ["Email", "Phone", "In-app messaging"] as const

export type ContactPreference = (typeof CONTACT_OPTIONS)[number]

export const MODERATION_STATUS_OPTIONS = ["pending", "approved", "rejected"] as const
export type ModerationStatusOption = (typeof MODERATION_STATUS_OPTIONS)[number]
