import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import ApiService from '../../../services/ApiService';
import {
	CreateInvitationData,
	Invitation,
	InvitationStats,
} from '@/interface/invitacion.interface';
import { INVITATION_ENDPOINTS } from '@/constants/invitations.constant';

const DEFAULT_STATS: InvitationStats = {
	total: 0,
	pending: 0,
	sent: 0,
	accepted: 0,
	expired: 0,
	cancelled: 0,
};

const clampPage = (page: number, totalPages: number): number => {
	if (totalPages <= 0) return 1;
	if (page < 1) return 1;
	if (page > totalPages) return totalPages;
	return page;
};

const calculateStats = (items: Invitation[]): InvitationStats => {
	const next = { ...DEFAULT_STATS };
	next.total = items.length;
	items.forEach((invitation) => {
		const status = invitation.status?.toLowerCase() ?? '';
		switch (status) {
			case 'pending':
				next.pending += 1;
				break;
			case 'sent':
			case 'used':
				next.sent += 1;
				break;
			case 'accepted':
				next.accepted += 1;
				break;
			case 'expired':
				next.expired += 1;
				break;
			case 'cancelled':
				next.cancelled += 1;
				break;
			default:
				break;
		}
	});
	return next;
};

const filterInvitations = (
	items: Invitation[],
	filters: InvitationsState['filters'],
): Invitation[] => {
	const searchTerm = filters.search.trim().toLowerCase();
	return items.filter((invitation) => {
		if (filters.status && invitation.status !== filters.status) {
			return false;
		}
		if (filters.role) {
			const roleValue = invitation.role ?? invitation.role_name ?? '';
			if (roleValue !== filters.role) return false;
		}
		if (filters.company_id && invitation.company_id !== filters.company_id) {
			return false;
		}
		if (filters.branch_id && invitation.branch_id !== filters.branch_id) {
			return false;
		}
		if (searchTerm) {
			const email = invitation.email?.toLowerCase() ?? '';
			const invitedBy = (invitation as any)?.invited_by?.toLowerCase?.() ?? '';
			if (!email.includes(searchTerm) && !invitedBy.includes(searchTerm)) {
				return false;
			}
		}
		return true;
	});
};

const applyPagination = (
	items: Invitation[],
	pagination: InvitationsState['pagination'],
): { paginated: Invitation[]; total: number; totalPages: number; page: number } => {
	const total = items.length;
	const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);
	const page = clampPage(pagination.page, totalPages);
	const start = (page - 1) * pagination.pageSize;
	const end = start + pagination.pageSize;
	return {
		paginated: items.slice(start, end),
		total,
		totalPages,
		page,
	};
};

export interface InvitationsState {
	allInvitations: Invitation[];
	filteredInvitations: Invitation[];
	invitations: Invitation[];
	selectedInvitation: Invitation | null;
	stats: InvitationStats;
	isLoading: boolean;
	error: string | null;
	loading: {
		invitations: boolean;
		create: boolean;
		resend: boolean;
		cancel: boolean;
	};
	filters: {
		search: string;
		status: string;
		role: string;
		company_id: number | null;
		branch_id: number | null;
	};
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

const initialState: InvitationsState = {
	allInvitations: [],
	filteredInvitations: [],
	invitations: [],
	selectedInvitation: null,
	stats: { ...DEFAULT_STATS },
	isLoading: false,
	error: null,
	loading: {
		invitations: false,
		create: false,
		resend: false,
		cancel: false,
	},
	filters: {
		search: '',
		status: '',
		role: '',
		company_id: null,
		branch_id: null,
	},
	pagination: {
		page: 1,
		pageSize: 10,
		total: 0,
		totalPages: 1,
	},
};

const DEFAULT_INVITATION_ERROR = 'Error al crear invitación';

type InvitationValidationErrors = Record<string, string[]>;

type InvitationErrorPayload = {
	message?: string;
	errors?: InvitationValidationErrors;
};

const extractFirstError = (errors?: InvitationValidationErrors): string | undefined => {
	if (!errors) return undefined;
	for (const key of Object.keys(errors)) {
		const messages = errors[key];
		if (Array.isArray(messages) && messages.length > 0) {
			return messages[0];
		}
	}
	return undefined;
};

const resolveInvitationErrorMessage = (
	payload: InvitationErrorPayload | undefined,
	fallback: string,
): string => {
	if (!payload) return fallback;
	if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
		return payload.message;
	}
	const fromErrors = extractFirstError(payload.errors);
	return fromErrors ?? fallback;
};

export const fetchInvitations = createAsyncThunk<
	Invitation[],
	{ status?: string } | undefined,
	{ rejectValue: string }
>('invitations/fetchInvitations', async (params = {}, { rejectWithValue }) => {
	try {
		const queryString =
			params.status && params.status.length > 0
				? `?status=${encodeURIComponent(params.status)}`
				: '';

		const response = await ApiService.fetchData<{ data: Invitation[] }>({
			url: `${INVITATION_ENDPOINTS.list}${queryString}`,
			method: 'get',
		});

		const data = response.data?.data;
		return Array.isArray(data) ? data.filter(Boolean) : [];
	} catch (error: any) {
		return rejectWithValue(error?.response?.data?.message || 'Error al cargar invitaciones');
	}
});

export const createInvitation = createAsyncThunk<
	Partial<Invitation>,
	CreateInvitationData,
	{ rejectValue: InvitationErrorPayload }
>('invitations/create', async (data, { rejectWithValue }) => {
	try {
		const sanitizedPayload = Object.fromEntries(
			Object.entries(data).filter(([_, value]) => {
				if (value === undefined || value === null) return false;
				if (typeof value === 'string' && value.trim() === '') return false;
				if (Array.isArray(value) && value.length === 0) return false;
				return true;
			}),
		);

		const response = await ApiService.fetchData<Invitation | { invitation: Invitation }>({
			url: '/user/invite',
			method: 'post',
			data: sanitizedPayload as Record<string, unknown>,
		});

		const payload = (response.data as any)?.invitation ?? response.data;
		return payload as Partial<Invitation>;
	} catch (error: any) {
		const payload = (error?.response?.data && typeof error.response.data === 'object'
			? error.response.data
			: undefined) ?? { message: error?.message ?? DEFAULT_INVITATION_ERROR };
		return rejectWithValue(payload);
	}
});

export const resendInvitation = createAsyncThunk(
	'invitations/resend',
	async (invitationId: number, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ invitation: Invitation }>({
				url: INVITATION_ENDPOINTS.resend(invitationId),
				method: 'post',
			});

			return response.data.invitation;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al reenviar invitación',
			);
		}
	},
);

export const cancelInvitation = createAsyncThunk(
	'invitations/cancel',
	async (invitationId: number, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ invitation: Invitation }>({
				url: INVITATION_ENDPOINTS.cancel(invitationId),
				method: 'delete',
			});

			return response.data.invitation;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al cancelar invitación',
			);
		}
	},
);

export const fetchInvitationDetails = createAsyncThunk(
	'invitations/fetchDetails',
	async (invitationId: number, { rejectWithValue }) => {
		try {
			const response = await ApiService.fetchData<{ invitation: Invitation }>({
				url: INVITATION_ENDPOINTS.details(invitationId),
				method: 'get',
			});

			return response.data.invitation;
		} catch (error: any) {
			return rejectWithValue(
				error?.response?.data?.message || 'Error al cargar detalles de invitación',
			);
		}
	},
);

const applyFiltersAndPagination = (state: InvitationsState) => {
	const filtered = filterInvitations(state.allInvitations, state.filters);
	const paginationResult = applyPagination(filtered, state.pagination);
	state.filteredInvitations = filtered;
	state.invitations = paginationResult.paginated;
	state.pagination.total = paginationResult.total;
	state.pagination.totalPages = paginationResult.totalPages;
	state.pagination.page = paginationResult.page;
	state.stats = calculateStats(filtered);
};

const invitationsSlice = createSlice({
	name: 'invitations',
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
			state.filters = { ...state.filters, ...action.payload };
			// Reset page whenever filters change
			state.pagination.page = 1;
			applyFiltersAndPagination(state);
		},
		clearFilters: (state) => {
			state.filters = { ...initialState.filters };
			state.pagination.page = 1;
			applyFiltersAndPagination(state);
		},
		setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
			state.pagination = { ...state.pagination, ...action.payload };
			applyFiltersAndPagination(state);
		},
		setSelectedInvitation: (state, action: PayloadAction<Invitation | null>) => {
			state.selectedInvitation = action.payload;
		},
		clearSelectedInvitation: (state) => {
			state.selectedInvitation = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchInvitations.pending, (state) => {
				state.loading.invitations = true;
				state.error = null;
			})
			.addCase(fetchInvitations.fulfilled, (state, action) => {
				state.loading.invitations = false;
				state.allInvitations = action.payload;
				applyFiltersAndPagination(state);
			})
			.addCase(fetchInvitations.rejected, (state, action) => {
				state.loading.invitations = false;
				state.error =
					typeof action.payload === 'string'
						? action.payload
						: 'Error al cargar invitaciones';
			})

			.addCase(createInvitation.pending, (state) => {
				state.loading.create = true;
			})
			.addCase(createInvitation.fulfilled, (state) => {
				state.loading.create = false;
			})
			.addCase(createInvitation.rejected, (state, action) => {
				state.loading.create = false;
				if (action.payload) {
					state.error = resolveInvitationErrorMessage(
						action.payload,
						DEFAULT_INVITATION_ERROR,
					);
				} else {
					state.error = action.error.message ?? DEFAULT_INVITATION_ERROR;
				}
			})

			.addCase(resendInvitation.pending, (state) => {
				state.loading.resend = true;
			})
			.addCase(resendInvitation.fulfilled, (state, action) => {
				state.loading.resend = false;
				const updateIndex = state.allInvitations.findIndex(
					(invitation) => invitation.id === action.payload.id,
				);
				if (updateIndex !== -1) {
					state.allInvitations[updateIndex] = action.payload;
				}
				if (state.selectedInvitation?.id === action.payload.id) {
					state.selectedInvitation = action.payload;
				}
				applyFiltersAndPagination(state);
			})
			.addCase(resendInvitation.rejected, (state, action) => {
				state.loading.resend = false;
				state.error =
					typeof action.payload === 'string'
						? action.payload
						: (action.error.message ?? 'Error al reenviar invitación');
			})

			.addCase(cancelInvitation.pending, (state) => {
				state.loading.cancel = true;
			})
			.addCase(cancelInvitation.fulfilled, (state, action) => {
				state.loading.cancel = false;
				// Verificar que action.payload existe y tiene la estructura esperada
				if (
					action.payload &&
					typeof action.payload === 'object' &&
					'id' in action.payload
				) {
					const updateIndex = state.allInvitations.findIndex(
						(invitation) => invitation.id === action.payload.id,
					);
					if (updateIndex !== -1) {
						state.allInvitations[updateIndex] = action.payload;
					}
					if (state.selectedInvitation?.id === action.payload.id) {
						state.selectedInvitation = action.payload;
					}
					applyFiltersAndPagination(state);
				}
			})
			.addCase(cancelInvitation.rejected, (state, action) => {
				state.loading.cancel = false;
				state.error =
					typeof action.payload === 'string'
						? action.payload
						: (action.error.message ?? 'Error al cancelar invitación');
			})

			.addCase(fetchInvitationDetails.fulfilled, (state, action) => {
				state.selectedInvitation = action.payload;
				const index = state.allInvitations.findIndex(
					(invitation) => invitation.id === action.payload.id,
				);
				if (index !== -1) {
					state.allInvitations[index] = action.payload;
					applyFiltersAndPagination(state);
				}
			});
	},
});

export const {
	setFilters,
	clearFilters,
	setSelectedInvitation,
	clearSelectedInvitation,
	setPagination,
} = invitationsSlice.actions;
export default invitationsSlice.reducer;
