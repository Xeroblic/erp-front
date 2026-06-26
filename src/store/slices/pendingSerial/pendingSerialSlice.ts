import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import {
	fetchPendingSerialAssignment,
	fetchPendingSerialAssignmentCount,
	type PendingSerialSale,
	type PendingSerialFilters,
	type PaginatedResponse,
	type PaginationMeta,
	type PaginationLinks,
} from '@/services/salesService';

export interface PendingSerialState {
	list: PendingSerialSale[];
	meta: PaginationMeta | null;
	links: PaginationLinks | null;
	count: number;
	loading: boolean;
	countLoading: boolean;
	error?: string | null;
}

const initialState: PendingSerialState = {
	list: [],
	meta: null,
	links: null,
	count: 0,
	loading: false,
	countLoading: false,
	error: null,
};

const getErrorMessage = (err: unknown, fallback: string): string => {
	if (typeof err === 'string') return err;
	if (err && typeof err === 'object') {
		const maybeResponse = (
			err as { response?: { data?: { message?: string; errors?: string[] } } }
		).response;
		const msg = maybeResponse?.data?.message || maybeResponse?.data?.errors?.[0];
		if (msg) return msg;
	}
	return fallback;
};

export const loadPendingSerialList = createAsyncThunk<
	PaginatedResponse<PendingSerialSale>,
	{ subsidiaryId: number; filters?: PendingSerialFilters },
	{ rejectValue: string }
>('pendingSerial/loadList', async ({ subsidiaryId, filters = {} }, { rejectWithValue }) => {
	try {
		return await fetchPendingSerialAssignment(subsidiaryId, filters);
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, 'Error al cargar ventas pendientes de serie'));
	}
});

export const loadPendingSerialCount = createAsyncThunk<
	number,
	{ subsidiaryId: number },
	{ rejectValue: string }
>('pendingSerial/loadCount', async ({ subsidiaryId }, { rejectWithValue }) => {
	try {
		return await fetchPendingSerialAssignmentCount(subsidiaryId);
	} catch (err: unknown) {
		return rejectWithValue(getErrorMessage(err, 'Error al cargar el contador de series pendientes'));
	}
});

const pendingSerialSlice = createSlice({
	name: 'pendingSerial',
	initialState,
	reducers: {
		clearPendingSerialError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Lista
			.addCase(loadPendingSerialList.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(
				loadPendingSerialList.fulfilled,
				(state, action: PayloadAction<PaginatedResponse<PendingSerialSale>>) => {
					state.loading = false;
					state.list = action.payload.data;
					state.meta = action.payload.meta;
					state.links = action.payload.links;
				},
			)
			.addCase(loadPendingSerialList.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload || 'Error al cargar ventas pendientes de serie';
			})
			// Contador (badge)
			.addCase(loadPendingSerialCount.pending, (state) => {
				state.countLoading = true;
			})
			.addCase(loadPendingSerialCount.fulfilled, (state, action: PayloadAction<number>) => {
				state.countLoading = false;
				state.count = action.payload;
			})
			.addCase(loadPendingSerialCount.rejected, (state) => {
				state.countLoading = false;
			});
	},
});

export const { clearPendingSerialError } = pendingSerialSlice.actions;

// Selectores
const selectModule = (state: RootState): PendingSerialState | undefined =>
	(state as unknown as { pendingSerial?: PendingSerialState }).pendingSerial;

export const selectPendingSerialList = (state: RootState) => selectModule(state)?.list ?? [];
export const selectPendingSerialMeta = (state: RootState) => selectModule(state)?.meta ?? null;
export const selectPendingSerialCount = (state: RootState) => selectModule(state)?.count ?? 0;
export const selectPendingSerialLoading = (state: RootState) =>
	Boolean(selectModule(state)?.loading);
export const selectPendingSerialError = (state: RootState) => selectModule(state)?.error ?? null;

export default pendingSerialSlice.reducer;
