import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import ApiService from '@/services/ApiService'
import type {
  NotificationSsePayload,
  PaginatedNotificationsResponse,
  UserNotificationDTO,
  NotificationStatus,
} from '@/interface/notifications.interface'

export interface NotificationsMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface NotificationsFilters {
  status?: NotificationStatus | 'all'
  priority?: number
  module?: string
  branch_id?: number
  page?: number
  per_page?: number
}

export interface NotificationsState {
  items: UserNotificationDTO[]
  loading: boolean
  error: string | null
  meta: NotificationsMeta | null
  unreadCount: number
  streaming: { connected: boolean; lastEventId: number }
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: null,
  meta: null,
  unreadCount: 0,
  streaming: { connected: false, lastEventId: 0 },
}

const normalizeFromApi = (n: any): UserNotificationDTO => {
  return {
    id: Number(n.id),
    status: (n.status ?? 'unread') as NotificationStatus,
    bucket: n.bucket ?? null,
    assigned_to: n.assigned_to ?? null,
    delivered_channels: Array.isArray(n.delivered_channels) ? n.delivered_channels : [],
    aggregate_count: typeof n.aggregate_count === 'number' ? n.aggregate_count : 1,
    read_at: n.read_at ?? null,
    ack_at: n.ack_at ?? null,
    created_at: n.created_at ?? null,
    origin: n.origin ?? null,
    message: n.message ?? null,
    event: n.event ?? null,
  }
}

const normalizeFromSse = (s: NotificationSsePayload): UserNotificationDTO => {
  return {
    id: Number(s.id),
    status: s.is_read ? 'read' : 'unread',
    bucket: s.bucket ?? null,
    assigned_to: null,
    delivered_channels: [],
    aggregate_count: typeof s.aggregate_count === 'number' ? s.aggregate_count : 1,
    read_at: s.is_read ? s.created_at ?? null : null,
    ack_at: null,
    created_at: s.created_at ?? null,
    origin: null,
    message: s.message ?? null,
    event: { id: s.id, type_key: s.title ?? 'notification', payload: s.payload ?? {}, scope: null, module: undefined, priority: s.priority ?? undefined },
  }
}

const recomputeUnread = (arr: UserNotificationDTO[]) => arr.filter((n) => n.status !== 'read' && !n.read_at).length

export const fetchNotifications = createAsyncThunk<
  { items: UserNotificationDTO[]; meta: NotificationsMeta },
  NotificationsFilters | void,
  { rejectValue: string }
>('notifications/fetch', async (filters, { rejectWithValue }) => {
  try {
    const params: Record<string, any> = {}
    if (filters?.status && filters.status !== 'all') params.status = filters.status
    if (typeof filters?.priority === 'number') params.priority = filters?.priority
    if (filters?.module) params.module = filters.module
    if (filters?.branch_id) params.branch_id = filters.branch_id
    if (filters?.page) params.page = filters.page
    params.per_page = filters?.per_page ?? 15

    const response = await ApiService.fetchData<PaginatedNotificationsResponse>({
      url: '/me/notifications',
      method: 'get',
      params,
      dedupe: true,
      cacheTTLms: 5_000,
    })

    const raw = response.data
    const items = Array.isArray(raw?.data) ? raw.data.map(normalizeFromApi) : []
    const meta = raw?.meta ?? { current_page: 1, last_page: 1, per_page: items.length, total: items.length }
    return { items, meta }
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Error al cargar notificaciones')
  }
})

export const markRead = createAsyncThunk<{ id: number }, { id: number }, { rejectValue: string }>(
  'notifications/markRead',
  async ({ id }, { rejectWithValue }) => {
    try {
      await ApiService.fetchData({ url: `/notifications/${id}/read`, method: 'post' })
      return { id }
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar como leída')
    }
  },
)

export const markUnread = createAsyncThunk<{ id: number }, { id: number }, { rejectValue: string }>(
  'notifications/markUnread',
  async ({ id }, { rejectWithValue }) => {
    try {
      await ApiService.fetchData({ url: `/notifications/${id}/unread`, method: 'post' })
      return { id }
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar como no leída')
    }
  },
)

export const markAllRead = createAsyncThunk<{ updated: number }, void, { rejectValue: string }>(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const resp = await ApiService.fetchData<{ updated: number }>({ url: '/me/notifications/read-all', method: 'post' })
      const updated = Number(resp.data?.updated ?? 0)
      return { updated }
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar todas como leídas')
    }
  },
)

export const markAllUnread = createAsyncThunk<{ updated: number }, void, { rejectValue: string }>(
  'notifications/markAllUnread',
  async (_, { rejectWithValue }) => {
    try {
      const resp = await ApiService.fetchData<{ updated: number }>({ url: '/me/notifications/unread-all', method: 'post' })
      const updated = Number(resp.data?.updated ?? 0)
      return { updated }
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo revertir a no leídas')
    }
  },
)

export const deleteNotification = createAsyncThunk<{ id: number }, { id: number }, { rejectValue: string }>(
  'notifications/delete',
  async ({ id }, { rejectWithValue }) => {
    try {
      await ApiService.fetchData({ url: `/notifications/${id}`, method: 'delete' })
      return { id }
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo eliminar')
    }
  },
)

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    upsertMany(state, action: PayloadAction<UserNotificationDTO[]>) {
      const map = new Map<number, UserNotificationDTO>()
      for (const n of state.items) map.set(n.id, n)
      for (const n of action.payload) map.set(n.id, n)
      state.items = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0))
      state.unreadCount = recomputeUnread(state.items)
    },
    upsertFromSse(state, action: PayloadAction<NotificationSsePayload>) {
      const dto = normalizeFromSse(action.payload)
      const idx = state.items.findIndex((x) => x.id === dto.id)
      if (idx >= 0) state.items[idx] = { ...state.items[idx], ...dto }
      else state.items.unshift(dto)
      state.unreadCount = recomputeUnread(state.items)
      state.streaming.lastEventId = Math.max(state.streaming.lastEventId, dto.id)
    },
    setStreamingConnected(state, action: PayloadAction<boolean>) {
      state.streaming.connected = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.meta = action.payload.meta
        state.unreadCount = recomputeUnread(state.items)
        // track highest id for SSE resume and polling-diff
        const maxId = state.items.reduce((m, it) => (it.id > m ? it.id : m), state.streaming.lastEventId)
        state.streaming.lastEventId = maxId
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? 'Error al cargar notificaciones'
      })
      .addCase(markRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload.id)
        if (item) {
          item.status = 'read'
          item.read_at = new Date().toISOString()
        }
        state.unreadCount = recomputeUnread(state.items)
      })
      .addCase(markUnread.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload.id)
        if (item) {
          item.status = 'unread'
          item.read_at = null
        }
        state.unreadCount = recomputeUnread(state.items)
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, status: 'read', read_at: n.read_at ?? new Date().toISOString() }))
        state.unreadCount = 0
      })
      .addCase(markAllUnread.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, status: n.status === 'read' ? 'unread' : n.status, read_at: null }))
        state.unreadCount = recomputeUnread(state.items)
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n.id !== action.payload.id)
        state.unreadCount = recomputeUnread(state.items)
      })
  },
})

export const { upsertMany, upsertFromSse, setStreamingConnected } = notificationsSlice.actions

export default notificationsSlice.reducer
