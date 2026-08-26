import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import ApiService from '@/services/ApiService';
import type { RootState } from '@/store/rootReducer';
import type {
	IEquipmentWithdrawalListItem,
	IFetchWithdrawalsParams,
	IWithdrawalsListResponse,
} from '@/interface/equipmentWithdrawals.interface';
import {
	WITHDRAWALS_USE_MOCKS,
	buildWithdrawalsEndpoint,
	resolveWithdrawalsContext,
	type WithdrawalsEndpointMode,
} from '../withdrawalsApi';
import { fetchWithdrawalsMock } from '../mocks/mockWithdrawals';

export interface IWithdrawalsListMeta {
	current_page: number;
	last_page: number;
	per_page: number;
	total: number;
}

export interface EquipmentWithdrawalsState {
	list: IEquipmentWithdrawalListItem[];
	meta: IWithdrawalsListMeta | null;
	loading: boolean;
	error: string | null;
	ownerContext: string | null;
	requestId: string | null;
}

const initialState: EquipmentWithdrawalsState = {
	list: [],
	meta: null,
	loading: false,
	error: null,
	ownerContext: null,
	requestId: null,
};

export interface IFetchWithdrawalsArgs {
	branchId?: number | null;
	subsidiaryId?: number | null;
	endpointMode?: WithdrawalsEndpointMode;
	params?: IFetchWithdrawalsParams;
}

interface IFetchWithdrawalsResult {
	items: IEquipmentWithdrawalListItem[];
	meta: IWithdrawalsListMeta | null;
	ownerContext: string;
}

const ownerContextFromArgs = ({ branchId, subsidiaryId }: IFetchWithdrawalsArgs): string =>
	`branch:${branchId ?? 'none'}|subsidiary:${subsidiaryId ?? 'none'}`;

const toMeta = (
	meta: IWithdrawalsListResponse['meta'] | undefined,
): IWithdrawalsListMeta | null => {
	if (!meta || typeof meta.current_page !== 'number') return null;
	return {
		current_page: meta.current_page,
		last_page: meta.last_page ?? 1,
		per_page: meta.per_page ?? 20,
		total: meta.total ?? 0,
	};
};

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error && error.message.trim()) return error.message;
	return 'No se pudieron cargar los retiros';
};

export const fetchWithdrawals = createAsyncThunk<
	IFetchWithdrawalsResult,
	IFetchWithdrawalsArgs,
	{ state: RootState; rejectValue: string }
>(
	'equipmentWithdrawals/fetchWithdrawals',
	async (
		{ branchId, subsidiaryId, endpointMode, params = {} },
		{ getState, rejectWithValue },
	) => {
		try {
			const ownerContext = ownerContextFromArgs({ branchId, subsidiaryId });
			if (WITHDRAWALS_USE_MOCKS) {
				const response = await fetchWithdrawalsMock(params);
				return { items: response.data, meta: toMeta(response.meta), ownerContext };
			}

			const context = resolveWithdrawalsContext(getState(), {
				branchId,
				subsidiaryId,
				endpointMode,
			});
			const response = await ApiService.fetchData<IWithdrawalsListResponse>({
				url: buildWithdrawalsEndpoint(context, ''),
				method: 'get',
				params: params as Record<string, unknown>,
			});
			return {
				items: response.data.data ?? [],
				meta: toMeta(response.data.meta),
				ownerContext,
			};
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	},
);

const equipmentWithdrawalsSlice = createSlice({
	name: 'equipmentWithdrawals',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchWithdrawals.pending, (state, action) => {
				state.loading = true;
				state.error = null;
				state.list = [];
				state.meta = null;
				state.requestId = action.meta.requestId;
				state.ownerContext = ownerContextFromArgs(action.meta.arg);
			})
			.addCase(fetchWithdrawals.fulfilled, (state, action) => {
				if (action.meta.requestId !== state.requestId) return;
				state.loading = false;
				state.list = action.payload.items;
				state.meta = action.payload.meta;
				state.ownerContext = action.payload.ownerContext;
			})
			.addCase(fetchWithdrawals.rejected, (state, action) => {
				if (action.meta.requestId !== state.requestId) return;
				state.loading = false;
				state.error = action.payload ?? 'No se pudieron cargar los retiros';
			});
	},
});

export const selectWithdrawals = (state: RootState): IEquipmentWithdrawalListItem[] =>
	state.equipmentWithdrawals.list;
export const selectWithdrawalsMeta = (state: RootState): IWithdrawalsListMeta | null =>
	state.equipmentWithdrawals.meta;
export const selectWithdrawalsLoading = (state: RootState): boolean =>
	state.equipmentWithdrawals.loading;
export const selectWithdrawalsError = (state: RootState): string | null =>
	state.equipmentWithdrawals.error;
export const selectWithdrawalsOwnerContext = (state: RootState): string | null =>
	state.equipmentWithdrawals.ownerContext;

export default equipmentWithdrawalsSlice.reducer;
