import { useMemo } from 'react'

import ConversationList from '../components/messages/ConversationList'
import MessageComposer from '../components/messages/MessageComposer'
import { AUTH_TOKEN_STORAGE_KEY } from '../constants/auth'
import { useConversations } from '../hooks/useConversations'

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString()
}

const Messages = () => {
  const token = useMemo(() => getInitialToken(), [])
  const {
    conversations,
    conversationsStatus,
    conversationsError,
    selectedConversation,
    selectedConversationId,
    selectConversation,
    messages,
    messagesStatus,
    messagesError,
    sendMessage,
    sendStatus,
    sendError,
  } = useConversations(token)

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 lg:px-0">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Messages</h1>
        <p className="mt-2 text-sm text-slate-600">
          Stay in touch with other community members and keep conversations going.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Conversations
          </h2>
          <div className="h-[480px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={selectConversation}
              isLoading={conversationsStatus === 'loading'}
              error={conversationsError}
            />
          </div>
        </aside>

        <div className="flex min-h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {selectedConversation ? (
            <div className="flex flex-1 flex-col">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedConversation.topic}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedConversation.participants
                    .map((participant) => participant.name || participant.email)
                    .join(', ')}
                </p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto py-6 pr-1">
                {messagesStatus === 'loading' ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Loading messages…
                  </div>
                ) : null}

                {messagesStatus === 'error' && messagesError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                    {messagesError}
                  </div>
                ) : null}

                {messagesStatus === 'success' && messages.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No messages yet. Say hello to get things started!
                  </div>
                ) : null}

                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {message.sender.name || message.sender.email}
                      </span>
                      <span>{formatTimestamp(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4">
                {messagesStatus === 'error' ? (
                  <p className="text-sm text-slate-500">
                    Resolve the issue above before sending new messages.
                  </p>
                ) : (
                  <MessageComposer
                    onSend={sendMessage}
                    isSending={sendStatus === 'loading'}
                    error={sendError}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-500">
              {conversationsStatus === 'loading' ? (
                <p>Loading conversations…</p>
              ) : conversationsError ? (
                <p>{conversationsError}</p>
              ) : (
                <p>Select a conversation to view messages.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Messages
