import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type {
	PaginatedNotificationsResponse,
	UserNotificationDTO,
	NotificationStatus,
} from '@/interface/notifications.interface';

export interface NotificationsMeta {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
}

export interface NotificationsFilters {
	status?: NotificationStatus | 'all';
	priority?: number | string;
	module?: string;
	branch_id?: number;
	page?: number;
	per_page?: number;
}

export interface NotificationsState {
	items: UserNotificationDTO[];
	loading: boolean;
	error: string | null;
	meta: NotificationsMeta | null;
	unreadCount: number;
}

const initialState: NotificationsState = {
	items: [],
	loading: false,
	error: null,
	meta: null,
	unreadCount: 0,
};

const normalizeErrorNames = (value: unknown): string[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
		.filter((entry) => Boolean(entry));
};

const deriveNotificationMessage = (n: any): string | null => {
	const directMessage = n?.message;
	if (typeof directMessage === 'string' && directMessage.trim()) {
		return directMessage;
	}

	const payload = n?.event?.payload ?? n?.payload;
	if (!payload || typeof payload !== 'object') return null;

	const payloadMessage = (payload as Record<string, unknown>)?.message;
	if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
		return payloadMessage;
	}

	const typeKey = String(n?.event?.type_key ?? n?.type_key ?? '');
	if (typeKey !== 'inventory.batch-adjustment-failed') {
		return null;
	}

	const payloadRecord = payload as Record<string, unknown>;
	const failedIds = Array.isArray(payloadRecord.failed_item_ids)
		? payloadRecord.failed_item_ids.length
		: 0;
	const branchName =
		typeof payloadRecord.branch_name === 'string' ? payloadRecord.branch_name.trim() : '';
	const subsidiaryName =
		typeof payloadRecord.subsidiary_name === 'string'
			? payloadRecord.subsidiary_name.trim()
			: '';
	const errorNames = normalizeErrorNames(payloadRecord.failed_item_names);

	const locationParts = [branchName, subsidiaryName].filter(Boolean);
	const locationLabel = locationParts.length ? ` en ${locationParts.join(' / ')}` : '';
	const details = errorNames.length ? ` Productos: ${errorNames.join(', ')}.` : '';

	return `El ajuste por lote fallo${locationLabel}. Items afectados: ${failedIds}.${details}`;
};

const normalizeFromApi = (n: any): UserNotificationDTO => {
	const normalizedMessage = deriveNotificationMessage(n);
	const eventPayload = n.event?.payload ?? n.payload ?? null;
	const eventScope = n.event?.scope ?? n.scope ?? null;
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
		message: normalizedMessage,
		delivered_to_user: typeof n.delivered_to_user === 'boolean' ? n.delivered_to_user : false,
		event: {
			id: n.event?.id ?? n.event_id ?? n.id ?? null,
			type_key: n.event?.type_key ?? n.type_key ?? null,
			type_label: n.event?.type_label ?? n.type_label ?? null,
			module: n.event?.module ?? n.module ?? null,
			module_label: n.event?.module_label ?? n.module_label ?? null,
			priority: n.event?.priority ?? n.priority ?? null,
			payload: eventPayload,
			scope: eventScope,
		},
	};
};

// Contar no leídas basándose en el estado, ignorando read_at
const recomputeUnread = (arr: UserNotificationDTO[]) =>
	arr.filter((n) => n.status !== 'read' && n.status !== 'ack').length;

export const fetchNotifications = createAsyncThunk<
	{ items: UserNotificationDTO[]; meta: NotificationsMeta },
	NotificationsFilters | void,
	{ rejectValue: string }
>('notifications/fetch', async (filters, { rejectWithValue }) => {
	try {
		const params: Record<string, any> = {};
		// Si status es 'all' o no viene, no enviar para que el backend devuelva todo
		if (filters?.status && filters.status !== 'all') params.status = filters.status;
		if (filters?.priority != null) params.priority = filters.priority as any;
		if (filters?.module) params.module = filters.module;
		if (filters?.branch_id) params.branch_id = filters.branch_id;
		if (filters?.page) params.page = filters.page;
		params.per_page = filters?.per_page ?? 15;

		const response = await ApiService.fetchData<PaginatedNotificationsResponse>({
			url: '/me/notifications',
			method: 'get',
			params,
			dedupe: true,
			cacheTTLms: 15000,
		});

		const raw = response.data;
		const items = Array.isArray(raw?.data) ? raw.data.map(normalizeFromApi) : [];
		const meta = raw?.meta ?? {
			current_page: 1,
			last_page: 1,
			per_page: items.length,
			total: items.length,
		};
		return { items, meta };
	} catch (e: any) {
		return rejectWithValue(
			e?.response?.data?.message ?? e?.message ?? 'Error al cargar notificaciones',
		);
	}
});

export const markRead = createAsyncThunk<{ id: number }, { id: number }, { rejectValue: string }>(
	'notifications/markRead',
	async ({ id }, { rejectWithValue }) => {
		try {
			await ApiService.fetchData({ url: `/notifications/${id}/read`, method: 'post' });
			return { id };
		} catch (e: any) {
			return rejectWithValue(
				e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar como leída',
			);
		}
	},
);

export const markUnread = createAsyncThunk<{ id: number }, { id: number }, { rejectValue: string }>(
	'notifications/markUnread',
	async ({ id }, { rejectWithValue }) => {
		try {
			await ApiService.fetchData({ url: `/notifications/${id}/unread`, method: 'post' });
			return { id };
		} catch (e: any) {
			return rejectWithValue(
				e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar como no leída',
			);
		}
	},
);

export const markAllRead = createAsyncThunk<{ updated: number }, void, { rejectValue: string }>(
	'notifications/markAllRead',
	async (_, { rejectWithValue }) => {
		try {
			const resp = await ApiService.fetchData<{ updated: number }>({
				url: '/me/notifications/read-all',
				method: 'post',
			});
			const updated = Number(resp.data?.updated ?? 0);
			return { updated };
		} catch (e: any) {
			return rejectWithValue(
				e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar todas como leídas',
			);
		}
	},
);

export const markAllUnread = createAsyncThunk<{ updated: number }, void, { rejectValue: string }>(
	'notifications/markAllUnread',
	async (_, { rejectWithValue }) => {
		try {
			const resp = await ApiService.fetchData<{ updated: number }>({
				url: '/me/notifications/unread-all',
				method: 'post',
			});
			const updated = Number(resp.data?.updated ?? 0);
			return { updated };
		} catch (e: any) {
			return rejectWithValue(
				e?.response?.data?.message ?? e?.message ?? 'No se pudo revertir a no leídas',
			);
		}
	},
);

export const deleteNotification = createAsyncThunk<
	{ id: number },
	{ id: number },
	{ rejectValue: string }
>('notifications/delete', async ({ id }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({ url: `/notifications/${id}`, method: 'delete' });
		return { id };
	} catch (e: any) {
		return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo eliminar');
	}
});

// Marcar como archivada (ACK)
export const ackNotification = createAsyncThunk<
	{ id: number; ack_at?: string },
	{ id: number },
	{ rejectValue: string }
>('notifications/ack', async ({ id }, { rejectWithValue }) => {
	try {
		const resp = await ApiService.fetchData<{ ok: boolean; ack_at?: string }>({
			url: `/notifications/${id}/ack`,
			method: 'post',
		});
		return { id, ack_at: resp.data?.ack_at };
	} catch (e: any) {
		return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'No se pudo archivar');
	}
});

// Quitar de archivadas (UNACK). Se intenta primero DELETE /ack y como fallback POST /unack
export const unackNotification = createAsyncThunk<
	{ id: number },
	{ id: number },
	{ rejectValue: string }
>('notifications/unack', async ({ id }, { rejectWithValue }) => {
	try {
		// Única ruta soportada para desarchivar (toggle en backend)
		await ApiService.fetchData<{ ok: boolean }>({
			url: `/notifications/${id}/ack`,
			method: 'post',
			params: { action: 'unack' } as any,
		});
		return { id };
	} catch (e: any) {
		return rejectWithValue(
			e?.response?.data?.message ?? e?.message ?? 'No se pudo desarchivar',
		);
	}
});

// Marcar notificaciones como entregadas (delivered_to_user = true)
export const markDelivered = createAsyncThunk<
	{ ids: number[] },
	{ ids: number[] },
	{ rejectValue: string }
>('notifications/markDelivered', async ({ ids }, { rejectWithValue }) => {
	try {
		await ApiService.fetchData({
			url: '/me/notifications/delivered',
			method: 'post',
			data: { notification_ids: ids },
		});
		return { ids };
	} catch (e: any) {
		return rejectWithValue(
			e?.response?.data?.message ?? e?.message ?? 'No se pudo marcar como entregada',
		);
	}
});

// Marcar TODAS las notificaciones como entregadas
export const markAllDelivered = createAsyncThunk<void, void, { rejectValue: string }>(
	'notifications/markAllDelivered',
	async (_, { rejectWithValue }) => {
		try {
			await ApiService.fetchData({
				url: '/me/notifications/delivered-all',
				method: 'post',
			});
		} catch (e: any) {
			return rejectWithValue(
				e?.response?.data?.message ??
					e?.message ??
					'No se pudo marcar todas como entregadas',
			);
		}
	},
);

const notificationsSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		setLocalStatus(
			state,
			action: PayloadAction<{
				id: number;
				status?: NotificationStatus;
				read_at?: string | null;
				ack_at?: string | null;
			}>,
		) {
			const it = state.items.find((n) => n.id === action.payload.id);
			if (it) {
				if (action.payload.status) it.status = action.payload.status;
				if (action.payload.read_at !== undefined) it.read_at = action.payload.read_at;
				if (action.payload.ack_at !== undefined) it.ack_at = action.payload.ack_at;
			}
			state.unreadCount = recomputeUnread(state.items);
		},
		upsertMany(state, action: PayloadAction<UserNotificationDTO[]>) {
			const map = new Map<number, UserNotificationDTO>();
			for (const n of state.items) map.set(n.id, n);
			for (const raw of action.payload) {
				const n = normalizeFromApi(raw);
				map.set(n.id, n);
			}
			state.items = Array.from(map.values()).sort((a, b) => (b.id || 0) - (a.id || 0));
			state.unreadCount = recomputeUnread(state.items);
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchNotifications.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchNotifications.fulfilled, (state, action) => {
				state.loading = false;
				state.items = action.payload.items;
				state.meta = action.payload.meta;
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(fetchNotifications.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload ?? 'Error al cargar notificaciones';
			})
			.addCase(markRead.fulfilled, (state, action) => {
				const item = state.items.find((n) => n.id === action.payload.id);
				if (item) {
					item.status = 'read';
					item.read_at = new Date().toISOString();
				}
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(markUnread.fulfilled, (state, action) => {
				const item = state.items.find((n) => n.id === action.payload.id);
				if (item) {
					item.status = 'unread';
					item.read_at = null;
				}
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(markAllRead.fulfilled, (state) => {
				state.items = state.items.map((n) => ({
					...n,
					status: 'read',
					read_at: n.read_at ?? new Date().toISOString(),
				}));
				state.unreadCount = 0;
			})
			.addCase(markAllUnread.fulfilled, (state) => {
				state.items = state.items.map((n) => ({
					...n,
					status: n.status === 'read' ? 'unread' : n.status,
					read_at: null,
				}));
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(deleteNotification.fulfilled, (state, action) => {
				state.items = state.items.filter((n) => n.id !== action.payload.id);
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(ackNotification.fulfilled, (state, action) => {
				const it = state.items.find((n) => n.id === action.payload.id);
				if (it) {
					it.status = 'ack';
					it.ack_at = action.payload.ack_at ?? new Date().toISOString();
				}
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(unackNotification.fulfilled, (state, action) => {
				const it = state.items.find((n) => n.id === action.payload.id);
				if (it) {
					// Al desarchivar, mandar a "unread" por defecto
					it.status = 'unread';
					it.read_at = null;
					it.ack_at = null;
				}
				state.unreadCount = recomputeUnread(state.items);
			})
			.addCase(markDelivered.fulfilled, (state, action) => {
				for (const id of action.payload.ids) {
					const it = state.items.find((n) => n.id === id);
					if (it) {
						it.delivered_to_user = true;
					}
				}
			})
			.addCase(markAllDelivered.fulfilled, (state) => {
				for (const it of state.items) {
					it.delivered_to_user = true;
				}
			});
	},
});

export const { upsertMany, setLocalStatus } = notificationsSlice.actions;

export default notificationsSlice.reducer;
