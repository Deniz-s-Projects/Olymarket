import { createContext } from 'react'

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

export type NotificationsContextValue = {
  notifications: Notification[]
  addNotification: (input: NotificationInput) => string
  dismissNotification: (id: string) => void
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
)
