import { type FormEvent, useState } from 'react'

interface MessageComposerProps {
  onSend: (message: string) => Promise<void>
  isSending?: boolean
  error?: string | null
}

const MessageComposer = ({ onSend, isSending = false, error = null }: MessageComposerProps) => {
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!message.trim()) {
      return
    }

    try {
      await onSend(message.trim())
      setMessage('')
    } catch (sendError) {
      console.error('Failed to send message', sendError)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Write a message…"
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          disabled={isSending}
        />
      </div>

      {error ? (
        <div className="text-sm text-red-600" role="alert">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/50"
          disabled={isSending || !message.trim()}
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  )
}

export default MessageComposer
