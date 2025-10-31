import { createContext, useReducer, useMemo, useEffect, type ReactNode } from 'react'
import NotificationStack from '../components/notifications/NotificationStack'

export type NotificationVariant = 'info' | 'success' | 'warning' | 'danger'

export type Notification = {
  id: string
  title?: string
  message: string
  variant: NotificationVariant
  createdAt: number
  expiresAt?: number
}

export type NotificationInput = {
  id?: string
  title?: string
  message: string
  variant?: NotificationVariant
  durationMs?: number
}

type NotificationAction =
  | { type: 'add'; notification: Notification }
  | { type: 'dismiss'; id: string }
  | { type: 'sweep'; now: number }

type NotificationsState = Notification[]

type NotificationsContextValue = {
  notifications: Notification[]
  addNotification: (input: NotificationInput) => string
  dismissNotification: (id: string) => void
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
)

function notificationsReducer(state: NotificationsState, action: NotificationAction) {
  switch (action.type) {
    case 'add':
      return [
        action.notification,
        ...state.filter((item) => item.id !== action.notification.id),
      ]
    case 'dismiss':
      return state.filter((notification) => notification.id !== action.id)
    case 'sweep':
      return state.filter(
        (notification) =>
          !notification.expiresAt || notification.expiresAt > action.now
      )
    default:
      return state
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, dispatch] = useReducer(notificationsReducer, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      dispatch({ type: 'sweep', now: Date.now() })
    }, 30000)

    return () => window.clearInterval(interval)
  }, [])

  const value = useMemo<NotificationsContextValue>(() => {
    const addNotification = (input: NotificationInput) => {
      const now = Date.now()
      const id = input.id ?? createId()
      const notification: Notification = {
        id,
        title: input.title,
        message: input.message,
        variant: input.variant ?? 'info',
        createdAt: now,
        expiresAt: input.durationMs ? now + input.durationMs : undefined,
      }
      dispatch({ type: 'add', notification })
      return id
    }

    const dismissNotification = (id: string) => {
      dispatch({ type: 'dismiss', id })
    }

    return {
      notifications,
      addNotification,
      dismissNotification,
    }
  }, [notifications])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <NotificationStack
        notifications={notifications}
        onDismiss={value.dismissNotification}
      />
    </NotificationsContext.Provider>
  )
}
