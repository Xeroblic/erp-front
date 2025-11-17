import { createAsyncThunk, createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type {
	ICreateTransferRequest,
	ITransfer,
	TransferDirection,
} from '@/interface/transfers.interface';
import type { RootState } from '@/store/rootReducer';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';

type TransferFiltersState = {
	direction: TransferDirection;
	q: string;
	per_page: number;
};

type TransferMeta = {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
};

interface TransferListResponsePayload {
	success?: boolean;
	message?: string;
	filters?: {
		direction?: TransferDirection;
		q?: string | null;
		per_page?: number;
	};
	data: ITransfer[];
	meta: TransferMeta;
}

interface TransferPagination {
	currentPage: number;
	totalPages: number;
	perPage: number;
	totalTransfers: number;
}

export interface TransferState {
	loading: boolean;
	createLoading: boolean;
	error?: string;
	transfers: ITransfer[];
	pagination: TransferPagination;
	filters: TransferFiltersState;
	currentTransfer?: ITransfer;
}

const DEFAULT_FILTERS: TransferFiltersState = {
	direction: 'all',
	q: '',
	per_page: 15,
};

const initialState: TransferState = {
	loading: false,
	createLoading: false,
	transfers: [],
	error: undefined,
	currentTransfer: undefined,
	filters: { ...DEFAULT_FILTERS },
	pagination: {
		currentPage: 1,
		totalPages: 1,
		perPage: DEFAULT_FILTERS.per_page,
		totalTransfers: 0,
	},
};

const buildFilters = (
	current: TransferFiltersState,
	updates?: Partial<TransferFiltersState>,
): TransferFiltersState => ({
	direction: updates?.direction ?? current.direction,
	q: updates?.q ?? current.q,
	per_page: updates?.per_page ?? current.per_page,
});

const ensureBranch = (state: RootState): number | null => {
	return selectEffectiveSubsidiaryId(state);
};

export const fetchTransfers = createAsyncThunk<
	{ data: ITransfer[]; meta: TransferMeta; filters: TransferFiltersState },
	Partial<{ page: number; direction: TransferDirection; q: string; per_page: number }> | undefined,
	{ rejectValue: string; state: RootState }
>('transfers/fetchTransfers', async (params, { getState, rejectWithValue }) => {
	const state = getState();
	const branchId = ensureBranch(state);

	if (!branchId) {
		return rejectWithValue('Selecciona una sucursal para consultar transferencias');
	}

	const overrides = params ?? {};
	const appliedFilters = buildFilters(state.transferencias.filters, {
		direction: overrides.direction,
		q: overrides.q,
		per_page: overrides.per_page,
	});

	try {
		const response = await ApiService.fetchData<TransferListResponsePayload | ITransfer[]>({
			url: `/branches/${branchId}/transfers`,
			method: 'get',
			params: {
				page: overrides.page ?? state.transferencias.pagination.currentPage,
				direction: appliedFilters.direction,
				q: appliedFilters.q || undefined,
				per_page: appliedFilters.per_page,
			},
		});

		const raw = response.data;

		const payload: TransferListResponsePayload =
			Array.isArray(raw)
				? {
						data: raw,
						meta: undefined,
				  }
				: raw;
		const serverFilters = payload.filters || {};

		const meta = payload.meta ?? {
			current_page: overrides.page ?? state.transferencias.pagination.currentPage,
			last_page: 1,
			per_page: appliedFilters.per_page,
			total: payload.data?.length ?? 0,
		};

		return {
			data: payload.data ?? [],
			meta,
			filters: {
				direction: serverFilters.direction ?? appliedFilters.direction,
				q: (serverFilters.q ?? appliedFilters.q) || '',
				per_page: serverFilters.per_page ?? appliedFilters.per_page,
			},
		};
	} catch (error: any) {
		return rejectWithValue(
			error.response?.data?.message || 'Error al obtener transferencias',
		);
	}
});

export const fetchTransferById = createAsyncThunk<
	ITransfer,
	number,
	{ rejectValue: string; state: RootState }
>('transfers/fetchTransferById', async (id, { getState, rejectWithValue }) => {
	const state = getState();
	const branchId = ensureBranch(state);

	if (!branchId) {
		return rejectWithValue('Selecciona una sucursal para consultar transferencias');
	}

	try {
		const response = await ApiService.fetchData<{ data?: ITransfer } & Partial<ITransfer>>({
			url: `/branches/${branchId}/transfers/${id}`,
			method: 'get',
		});

		const payload = response.data;
		if (payload?.data) {
			return payload.data;
		}

		return payload as ITransfer;
	} catch (error: any) {
		return rejectWithValue(
			error.response?.data?.message || 'Error al obtener la transferencia',
		);
	}
});

type TransferErrorPayload = {
	message: string;
	errors?: Record<string, string[] | string>;
};

export const createTransfer = createAsyncThunk<
	ITransfer | null,
	ICreateTransferRequest,
	{ rejectValue: TransferErrorPayload; state: RootState }
>('transfers/createTransfer', async (transferData, { getState, rejectWithValue }) => {
	const state = getState();
	const branchId = ensureBranch(state);

	if (!branchId) {
		return rejectWithValue({
			message: 'Selecciona una sucursal para crear transferencias',
		});
	}

	try {
		const response = await ApiService.fetchData<{ data?: ITransfer }>({
			url: `/branches/${branchId}/transfers`,
			method: 'post',
			data: transferData,
		});

		return response.data?.data ?? null;
	} catch (error: any) {
		const payload = error.response?.data;
		return rejectWithValue({
			message: payload?.message || 'Error al crear transferencia',
			errors: payload?.errors,
		});
	}
});

const transfersSlice = createSlice({
	name: 'transferencias',
	initialState,
	reducers: {
		setFilters: (state, action: PayloadAction<Partial<TransferFiltersState>>) => {
			state.filters = buildFilters(state.filters, action.payload);
		},
		clearFilters: (state) => {
			state.filters = { ...DEFAULT_FILTERS };
		},
		clearCurrentTransfer: (state) => {
			state.currentTransfer = undefined;
		},
		clearError: (state) => {
			state.error = undefined;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchTransfers.pending, (state) => {
				state.loading = true;
				state.error = undefined;
			})
			.addCase(fetchTransfers.fulfilled, (state, action) => {
				state.loading = false;
				state.transfers = action.payload.data;
				state.filters = action.payload.filters;
				state.pagination = {
					currentPage: action.payload.meta.current_page,
					totalPages: action.payload.meta.last_page,
					perPage: action.payload.meta.per_page,
					totalTransfers: action.payload.meta.total,
				};
			})
			.addCase(fetchTransfers.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al cargar transferencias');
			})
			.addCase(fetchTransferById.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchTransferById.fulfilled, (state, action) => {
				state.loading = false;
				state.currentTransfer = action.payload;
			})
			.addCase(fetchTransferById.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
				toast.error(action.payload || 'Error al obtener la transferencia');
			})
			.addCase(createTransfer.pending, (state) => {
				state.createLoading = true;
				state.error = undefined;
			})
			.addCase(createTransfer.fulfilled, (state, action) => {
				state.createLoading = false;
				if (action.payload) {
					state.transfers = [action.payload, ...state.transfers];
					state.pagination.totalTransfers += 1;
				}
				toast.success('Transferencia registrada correctamente (scaffold)');
			})
			.addCase(createTransfer.rejected, (state, action) => {
				state.createLoading = false;
				const errorMessage = action.payload?.message || 'Error al crear transferencia';
				state.error = errorMessage;
				toast.error(errorMessage);
			});
	},
});

export const { setFilters, clearFilters, clearCurrentTransfer, clearError } =
	transfersSlice.actions;

export const selectTransfers = (state: RootState) => state.transferencias.transfers;
export const selectCurrentTransfer = (state: RootState) =>
	state.transferencias.currentTransfer;
export const selectTransfersLoading = (state: RootState) => state.transferencias.loading;
const selectTransfersSlice = (state: RootState) => state.transferencias;

export const selectTransfersPagination = createSelector(
	selectTransfersSlice,
	(slice) => slice.pagination,
);
export const selectTransferFilters = createSelector(
	selectTransfersSlice,
	(slice) => slice.filters,
);
export const selectTransferActionLoading = createSelector(
	selectTransfersSlice,
	(slice) => ({ create: slice.createLoading }),
);

export default transfersSlice.reducer;
