import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ApiError,
  getConversationMessages,
  getConversations,
  markConversationRead,
  postConversationMessage,
} from '../services/conversations'
import type {
  ConversationMessage,
  ConversationSummary,
} from '../services/conversations'

type Status = 'idle' | 'loading' | 'success' | 'error'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You don't have permission to view this conversation."
    }

    if (error.status === 404) {
      return 'This conversation could not be found.'
    }

    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.'
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message
    }
  }

  return 'Something went wrong. Please try again in a moment.'
}

export interface UseConversationsResult {
  conversations: ConversationSummary[]
  conversationsStatus: Status
  conversationsError: string | null
  selectedConversationId: string | null
  selectedConversation: ConversationSummary | null
  selectConversation: (conversationId: string) => void
  messages: ConversationMessage[]
  messagesStatus: Status
  messagesError: string | null
  sendMessage: (body: string) => Promise<void>
  sendStatus: Status
  sendError: string | null
  refreshMessages: () => Promise<void>
  refreshConversations: () => Promise<void>
}

export const useConversations = (
  token: string | null
): UseConversationsResult => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsStatus, setConversationsStatus] = useState<Status>('idle')
  const [conversationsError, setConversationsError] = useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [messagesStatus, setMessagesStatus] = useState<Status>('idle')
  const [messagesError, setMessagesError] = useState<string | null>(null)

  const [sendStatus, setSendStatus] = useState<Status>('idle')
  const [sendError, setSendError] = useState<string | null>(null)

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!token) {
        return
      }

      try {
        await markConversationRead(conversationId, token)
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        )
      } catch {
        // Best effort — surfacing this error would create unnecessary noise in the UI.
      }
    },
    [token]
  )

  const loadConversations = useCallback(async () => {
    if (!token) {
      setConversations([])
      setConversationsStatus('error')
      setConversationsError('You need to sign in to view conversations.')
      return
    }

    setConversationsStatus('loading')
    setConversationsError(null)

    try {
      const data = await getConversations(token)
      setConversations(data)
      setConversationsStatus('success')

      if (data.length > 0) {
        setSelectedConversationId((current) => {
          if (current && data.some((conversation) => conversation.id === current)) {
            return current
          }

          return data[0]?.id ?? null
        })
      } else {
        setSelectedConversationId(null)
      }
    } catch (error) {
      setConversationsStatus('error')
      setConversationsError(getErrorMessage(error))
    }
  }, [token])

  const loadMessages = useCallback(
    async (conversationId?: string) => {
      const targetConversationId = conversationId ?? selectedConversationId
      if (!token || !targetConversationId) {
        setMessages([])
        setMessagesStatus(token ? 'idle' : 'error')
        setMessagesError(
          token ? null : 'You need to sign in to view conversation messages.'
        )
        return
      }

      setMessagesStatus('loading')
      setMessagesError(null)

      try {
        const data = await getConversationMessages(targetConversationId, token)
        setMessages(data)
        setMessagesStatus('success')
      } catch (error) {
        setMessagesStatus('error')
        const message = getErrorMessage(error)
        setMessagesError(message)

        if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
          // Prevent the UI from showing stale data for conversations the user can no longer access.
          setMessages([])
        }
      }
    },
    [selectedConversationId, token]
  )

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedConversationId) {
      void markConversationAsRead(selectedConversationId)
      void loadMessages(selectedConversationId)
    } else {
      setMessages([])
      setMessagesStatus('idle')
      setMessagesError(null)
    }
  }, [selectedConversationId, loadMessages, markConversationAsRead])

  const selectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId)
  }, [])

  const sendMessage = useCallback(
    async (body: string) => {
      if (!token || !selectedConversationId) {
        setSendStatus('error')
        setSendError('Select a conversation before sending a message.')
        return
      }

      if (!body.trim()) {
        setSendStatus('error')
        setSendError('Message cannot be empty.')
        return
      }

      setSendStatus('loading')
      setSendError(null)

      try {
        const message = await postConversationMessage(
          selectedConversationId,
          { body },
          token
        )
        setMessages((current) => [...current, message])
        setSendStatus('success')
        void markConversationAsRead(selectedConversationId)
      } catch (error) {
        setSendStatus('error')
        setSendError(getErrorMessage(error))
        throw error
      }
    },
    [selectedConversationId, token, markConversationAsRead]
  )

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null
    return (
      conversations.find((conversation) => conversation.id === selectedConversationId) ??
      null
    )
  }, [conversations, selectedConversationId])

  const refreshMessages = useCallback(async () => {
    await loadMessages()
  }, [loadMessages])

  const refreshConversations = useCallback(async () => {
    await loadConversations()
  }, [loadConversations])

  return {
    conversations,
    conversationsStatus,
    conversationsError,
    selectedConversationId,
    selectedConversation,
    selectConversation,
    messages,
    messagesStatus,
    messagesError,
    sendMessage,
    sendStatus,
    sendError,
    refreshMessages,
    refreshConversations,
  }
}
