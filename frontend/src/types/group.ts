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
