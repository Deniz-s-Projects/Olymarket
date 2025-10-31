import { API_BASE_URL } from '../lib/apiClient'

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export interface ConversationParticipant {
  id: string
  userId: string
  name: string
  email: string
  lastReadAt: string | null
}

export interface ConversationSummary {
  id: string
  topic: string
  participants: ConversationParticipant[]
  createdAt: string
  updatedAt: string
  unreadCount: number
}

interface ConversationParticipantResponse {
  id: string
  userId: string
  name: string | null
  email: string
  lastReadAt: string | null
}

interface ConversationResponse {
  id: string
  topic: string
  createdAt: string
  updatedAt: string
  participants: ConversationParticipantResponse[]
  unreadCount?: number
}

interface PaginationMetadata {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface ConversationsPageResponse {
  data: ConversationResponse[]
  pagination: PaginationMetadata
}

export interface ConversationMessage {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string
    email: string
  }
}

interface ConversationMessageResponse {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string | null
    email: string
  }
}

interface ConversationMessagePayload {
  body: string
}

const buildHeaders = (token?: string, base?: HeadersInit): Headers => {
  const headers = new Headers(base)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json') ?? false

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    let details: unknown

    if (isJson) {
      try {
        details = await response.json()
        if (typeof (details as { message?: string })?.message === 'string') {
          message = (details as { message?: string }).message as string
        }
      } catch {
        details = undefined
      }
    }

    throw new ApiError(message, response.status, details)
  }

  if (!isJson || response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const mapConversation = (conversation: ConversationResponse): ConversationSummary => ({
  id: conversation.id,
  topic: conversation.topic,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
  participants: conversation.participants.map((participant) => ({
    id: participant.id,
    userId: participant.userId,
    name: participant.name ?? participant.email,
    email: participant.email,
    lastReadAt: participant.lastReadAt,
  })),
  unreadCount: conversation.unreadCount ?? 0,
})

const mapMessage = (message: ConversationMessageResponse): ConversationMessage => ({
  ...message,
  sender: {
    ...message.sender,
    name: message.sender.name ?? message.sender.email,
  },
})

export const getConversations = async (
  token: string
): Promise<ConversationSummary[]> => {
  const conversations: ConversationSummary[] = []
  let page = 1
  let limit: number | undefined

  // Continue requesting pages until the API indicates there are no more.
  while (true) {
    const params = new URLSearchParams({ page: page.toString() })
    if (typeof limit === 'number') {
      params.set('limit', limit.toString())
    }

    const query = params.toString()
    const response = await fetch(`${API_BASE_URL}/conversations?${query}`, {
      headers: buildHeaders(token),
    })

    const payload = await handleResponse<ConversationsPageResponse>(response)
    conversations.push(...payload.data.map(mapConversation))

    limit = payload.pagination.limit

    if (!payload.pagination.hasNextPage || payload.data.length === 0) {
      break
    }

    page = payload.pagination.page + 1
  }

  return conversations
}

interface CreateConversationPayload {
  topic: string
  participantIds: string[]
}

export const createConversation = async (
  payload: CreateConversationPayload,
  token: string
): Promise<ConversationSummary> => {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  })

  const data = await handleResponse<ConversationResponse>(response)
  return mapConversation(data)
}

export const getConversationMessages = async (
  conversationId: string,
  token: string
): Promise<ConversationMessage[]> => {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`,
    {
      headers: buildHeaders(token),
    }
  )

  const data = await handleResponse<ConversationMessageResponse[]>(response)
  return data.map(mapMessage)
}

export const postConversationMessage = async (
  conversationId: string,
  payload: ConversationMessagePayload,
  token: string
): Promise<ConversationMessage> => {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }
  )

  const data = await handleResponse<ConversationMessageResponse>(response)
  return mapMessage(data)
}

interface MarkConversationReadResponse {
  lastReadAt: string
}

export const markConversationRead = async (
  conversationId: string,
  token: string
): Promise<MarkConversationReadResponse> => {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
    method: 'PATCH',
    headers: buildHeaders(token),
  })

  return handleResponse<MarkConversationReadResponse>(response)
}
