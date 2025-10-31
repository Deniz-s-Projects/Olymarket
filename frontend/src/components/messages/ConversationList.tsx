import type { ConversationSummary } from '../../services/conversations'

interface ConversationListProps {
  conversations: ConversationSummary[]
  selectedId: string | null
  onSelect: (conversationId: string) => void
  isLoading?: boolean
  error?: string | null
}

const ConversationList = ({
  conversations,
  selectedId,
  onSelect,
  isLoading = false,
  error = null,
}: ConversationListProps) => {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading conversations…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        You don’t have any conversations yet.
      </div>
    )
  }

  return (
    <ul className="flex h-full flex-col gap-2">
      {conversations.map((conversation) => {
        const participantNames = conversation.participants
          .map((participant) => participant.name || participant.email)
          .join(', ')

        const isActive = conversation.id === selectedId
        const hasUnread = conversation.unreadCount > 0
        const unreadDisplay =
          conversation.unreadCount > 99 ? '99+' : conversation.unreadCount.toString()

        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent bg-white text-slate-700 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      hasUnread && !isActive ? 'text-slate-900' : ''
                    }`}
                  >
                    {conversation.topic}
                  </p>
                  <p
                    className={`mt-1 line-clamp-2 text-xs ${
                      isActive ? 'text-primary/80' : 'text-slate-500'
                    }`}
                  >
                    {participantNames}
                  </p>
                </div>
                {hasUnread && (
                  <span
                    className={`ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 text-xs font-semibold ${
                      isActive ? 'bg-primary text-white' : 'bg-primary/90 text-white'
                    }`}
                    aria-label={`${unreadDisplay} unread message${
                      conversation.unreadCount === 1 ? '' : 's'
                    }`}
                  >
                    {unreadDisplay}
                  </span>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default ConversationList
