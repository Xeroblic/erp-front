import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Warranty, WarrantyDetail } from '@/interface/warranties.interface';
import {
	createWarranty,
	deleteWarranty,
	fetchWarranties,
	fetchWarrantyDetails,
	updateWarranty,
} from './thunks';

export interface GarantiasState {
	list: Warranty[];
	meta: {
		total: number;
		current_page: number;
		per_page: number;
		last_page: number;
	};
	detail: WarrantyDetail | null;
	loading: boolean;
	error: string | null;
}

const initialState: GarantiasState = {
	list: [],
	meta: { total: 0, current_page: 1, per_page: 20, last_page: 1 },
	detail: null,
	loading: false,
	error: null,
};

const garantiasSlice = createSlice({
	name: 'garantias',
	initialState,
	reducers: {
		clearDetail: (state) => {
			state.detail = null;
		},
		clearGarantiasError: (state) => {
			state.error = null;
		},
		setGarantiasPage: (state, action: PayloadAction<number>) => {
			state.meta.current_page = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchWarranties.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchWarranties.fulfilled, (state, action) => {
				state.loading = false;
				state.list = action.payload.data;
				state.meta = action.payload.meta;
			})
			.addCase(fetchWarranties.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.payload ?? action.error?.message ?? 'Error al cargar las garantías';
			})
			.addCase(fetchWarrantyDetails.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchWarrantyDetails.fulfilled, (state, action) => {
				state.loading = false;
				state.detail = action.payload;
			})
			.addCase(fetchWarrantyDetails.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.payload ?? action.error?.message ?? 'Error al cargar la garantía';
			})
			.addCase(createWarranty.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createWarranty.fulfilled, (state, action) => {
				state.loading = false;
				state.list = [action.payload, ...state.list];
				state.meta.total += 1;
			})
			.addCase(createWarranty.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.payload ?? action.error?.message ?? 'No se pudo crear la garantía';
			})
			.addCase(updateWarranty.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateWarranty.fulfilled, (state, action) => {
				state.loading = false;
				state.list = state.list.map((w) =>
					w.id === action.payload.id ? action.payload : w,
				);
				if (state.detail?.id === action.payload.id) {
					state.detail = action.payload;
				}
			})
			.addCase(updateWarranty.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.payload ?? action.error?.message ?? 'No se pudo actualizar la garantía';
			})
			.addCase(deleteWarranty.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteWarranty.fulfilled, (state, action) => {
				state.loading = false;
				state.list = state.list.filter((w) => w.id !== action.payload.id);
				state.meta.total = Math.max(0, state.meta.total - 1);
				if (state.detail?.id === action.payload.id) {
					state.detail = null;
				}
			})
			.addCase(deleteWarranty.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.payload ?? action.error?.message ?? 'No se pudo eliminar la garantía';
			});
	},
});

export const { clearDetail, clearGarantiasError, setGarantiasPage } = garantiasSlice.actions;

export default garantiasSlice.reducer;
