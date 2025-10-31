import type { FC } from 'react'
import { useEffect } from 'react'
import type { Notification } from '../../context/NotificationsContext'

type Props = {
  notifications: Notification[]
  onDismiss: (id: string) => void
}

const variantClasses: Record<Notification['variant'], string> = {
  info: 'bg-slate-800 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-slate-900',
  danger: 'bg-rose-600 text-white',
}

const NotificationStack: FC<Props> = ({ notifications, onDismiss }) => {
  useEffect(() => {
    if (notifications.length === 0) return

    const timers = notifications.map((notification) => {
      if (!notification.expiresAt) return undefined
      const delay = notification.expiresAt - Date.now()
      if (delay <= 0) {
        onDismiss(notification.id)
        return undefined
      }

      const timeout = window.setTimeout(() => onDismiss(notification.id), delay)
      return timeout
    })

    return () => {
      timers.forEach((timeout) => {
        if (timeout) window.clearTimeout(timeout)
      })
    }
  }, [notifications, onDismiss])

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:justify-end">
      <div className="flex w-full max-w-sm flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto overflow-hidden rounded-lg shadow-lg transition ${variantClasses[notification.variant]}`}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1">
                {notification.title ? (
                  <p className="text-sm font-semibold">{notification.title}</p>
                ) : null}
                <p className="text-sm leading-relaxed">{notification.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(notification.id)}
                className="ml-2 rounded-full bg-black/10 px-2 py-1 text-xs font-semibold text-white transition hover:bg-black/20"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationStack
