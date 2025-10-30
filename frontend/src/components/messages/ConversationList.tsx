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
              <p className="text-sm font-semibold">{conversation.topic}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                {participantNames}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default ConversationList
