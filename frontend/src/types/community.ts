export type CommunityUserSummary = {
  id: string
  name: string
  email: string
}

export type CommunityComment = {
  id: string
  body: string
  author: CommunityUserSummary
  createdAt: string
  updatedAt: string
}

export type CommunityDiscussion = {
  id: string
  title: string
  body: string
  author: CommunityUserSummary
  comments: CommunityComment[]
  createdAt: string
  updatedAt: string
}

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  pageCount: number
  hasMore: boolean
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: PaginationMeta
}

export type CreateCommunityDiscussionPayload = {
  title: string
  body: string
}

export type CreateCommunityCommentPayload = {
  body: string
}
