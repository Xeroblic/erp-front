// src/interface/notifications.interface.ts

export type NotificationStatus = 'unread' | 'read' | 'ack' | 'assigned'

export type NotificationBucket = 'Important' | 'Pending' | 'Archived' | null

export interface NotificationScope {
  company_id?: number | null
  subsidiary_id?: number | null
  branch_id?: number | null
}

export interface NotificationEventDTO {
  id: number | string | null
  type_key?: string | null
  module?: string | null
  priority?: number | null
  payload?: Record<string, unknown> | null
  scope?: NotificationScope | null
}

export interface UserNotificationDTO {
  id: number
  status: NotificationStatus
  bucket?: NotificationBucket
  assigned_to?: number | null
  delivered_channels?: string[]
  aggregate_count?: number
  read_at?: string | null
  ack_at?: string | null
  created_at?: string | null
  event?: NotificationEventDTO | null
  origin?: string | null
  message?: string | null
}

export interface PaginatedNotificationsResponse {
  data: UserNotificationDTO[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// SSE payload shape (from backend StreamController)
export interface NotificationSsePayload {
  id: number
  title: string
  is_read: boolean
  bucket?: NotificationBucket
  priority?: number | null
  created_at?: string | null
  aggregate_count?: number
  payload?: Record<string, unknown> | null
  message?: string | null
  created_by?: string | null
  created_by_id?: number | null
  updated_by?: string | null
  updated_by_id?: number | null
}

