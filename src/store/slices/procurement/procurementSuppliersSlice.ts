import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
	createProcurementSupplier,
	deactivateProcurementSupplier,
	getProcurementSupplier,
	listProcurementSuppliers,
	restoreProcurementSupplier,
	updateProcurementSupplier,
} from '@/services/procurement/procurementSuppliers.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type { RootState } from '@/store';
import type {
	IApiPaginationMeta,
	IProcurementSupplier,
	IProcurementSupplierListParams,
	IProcurementSupplierListRow,
	IProcurementSupplierPayload,
} from '@/interface/procurement.interface';

/**
 * Store del maestro de proveedores (card 02 del módulo de abastecimiento,
 * sección 5 del contrato). Los thunks llaman al servicio mock de
 * `@/services/procurement/procurementSuppliers.service`: el día que el
 * endpoint exista, sólo ese servicio cambia.
 *
 * `subsidiaryId` viaja en cada thunk porque el contrato ata el RUT único a la
 * filial (`/api/subsidiaries/{subsidiary}/procurement/suppliers`); el mock lo
 * exige por la misma razón que lo exigirá la llamada real, aunque hoy no
 * lo use para filtrar.
 */

export interface ProcurementSuppliersState {
	items: IProcurementSupplierListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	current: IProcurementSupplier | null;
	currentLoading: boolean;
	currentError: string | null;
	creating: boolean;
	updating: boolean;
	deactivating: boolean;
	restoring: boolean;
}

const initialState: ProcurementSuppliersState = {
	items: [],
	meta: null,
	listLoading: false,
	listError: null,
	current: null,
	currentLoading: false,
	currentError: null,
	creating: false,
	updating: false,
	deactivating: false,
	restoring: false,
};

interface IWriteHeaders {
	idempotencyKey?: string;
}

const MISSING_SUBSIDIARY_MESSAGE = 'No se pudo determinar la filial activa.';

export const fetchProcurementSuppliers = createAsyncThunk(
	'procurementSuppliers/fetchList',
	async (
		args: { subsidiaryId: number | null; params?: IProcurementSupplierListParams },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			return await listProcurementSuppliers(args.params);
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const fetchProcurementSupplierDetail = createAsyncThunk(
	'procurementSuppliers/fetchDetail',
	async (args: { subsidiaryId: number | null; id: number }, { rejectWithValue }) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await getProcurementSupplier(args.id);
			return data;
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const createProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/create',
	async (
		args: {
			subsidiaryId: number | null;
			payload: IProcurementSupplierPayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await createProcurementSupplier(args.payload, args.headers);
			return data;
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const updateProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/update',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IProcurementSupplierPayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await updateProcurementSupplier(args.id, args.payload, args.headers);
			return data;
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const deactivateProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/deactivate',
	async (
		args: { subsidiaryId: number | null; id: number; headers?: IWriteHeaders },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await deactivateProcurementSupplier(args.id, args.headers);
			return data;
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const restoreProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/restore',
	async (
		args: { subsidiaryId: number | null; id: number; headers?: IWriteHeaders },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await restoreProcurementSupplier(args.id, args.headers);
			return data;
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

const toListRow = (supplier: IProcurementSupplier): IProcurementSupplierListRow => ({
	id: supplier.id,
	rut: supplier.rut,
	display_name: supplier.display_name,
	company_name: supplier.company_name,
	contact_name: supplier.contact_name,
	business_activity: supplier.business_activity,
	email: supplier.email,
	phone: supplier.phone,
	is_active: supplier.is_active,
});

/** Refleja en `items` y `current` el resultado de una escritura, sin refetch. */
const applySupplierMutation = (
	state: ProcurementSuppliersState,
	supplier: IProcurementSupplier,
) => {
	state.items = state.items.map((row) => (row.id === supplier.id ? toListRow(supplier) : row));
	if (state.current?.id === supplier.id) state.current = supplier;
};

const procurementSuppliersSlice = createSlice({
	name: 'procurementSuppliers',
	initialState,
	reducers: {
		clearProcurementSupplierCurrent(state) {
			state.current = null;
			state.currentError = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProcurementSuppliers.pending, (state) => {
				state.listLoading = true;
				state.listError = null;
			})
			.addCase(fetchProcurementSuppliers.fulfilled, (state, action) => {
				state.listLoading = false;
				state.items = action.payload.data;
				state.meta = action.payload.meta;
			})
			.addCase(fetchProcurementSuppliers.rejected, (state, action) => {
				state.listLoading = false;
				state.listError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el listado.',
				);
			})

			.addCase(fetchProcurementSupplierDetail.pending, (state) => {
				state.currentLoading = true;
				state.currentError = null;
			})
			.addCase(
				fetchProcurementSupplierDetail.fulfilled,
				(state, action: PayloadAction<IProcurementSupplier>) => {
					state.currentLoading = false;
					state.current = action.payload;
				},
			)
			.addCase(fetchProcurementSupplierDetail.rejected, (state, action) => {
				state.currentLoading = false;
				state.currentError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el proveedor.',
				);
				state.current = null;
			})

			.addCase(createProcurementSupplierThunk.pending, (state) => {
				state.creating = true;
			})
			.addCase(createProcurementSupplierThunk.fulfilled, (state) => {
				state.creating = false;
				// La lista se refresca desde el hook: acá no hay página/filtro que
				// mantener consistente sin repetir esa lógica.
			})
			.addCase(createProcurementSupplierThunk.rejected, (state) => {
				state.creating = false;
			})

			.addCase(updateProcurementSupplierThunk.pending, (state) => {
				state.updating = true;
			})
			.addCase(updateProcurementSupplierThunk.fulfilled, (state, action) => {
				state.updating = false;
				applySupplierMutation(state, action.payload);
			})
			.addCase(updateProcurementSupplierThunk.rejected, (state) => {
				state.updating = false;
			})

			.addCase(deactivateProcurementSupplierThunk.pending, (state) => {
				state.deactivating = true;
			})
			.addCase(deactivateProcurementSupplierThunk.fulfilled, (state, action) => {
				state.deactivating = false;
				applySupplierMutation(state, action.payload);
			})
			.addCase(deactivateProcurementSupplierThunk.rejected, (state) => {
				state.deactivating = false;
			})

			.addCase(restoreProcurementSupplierThunk.pending, (state) => {
				state.restoring = true;
			})
			.addCase(restoreProcurementSupplierThunk.fulfilled, (state, action) => {
				state.restoring = false;
				applySupplierMutation(state, action.payload);
			})
			.addCase(restoreProcurementSupplierThunk.rejected, (state) => {
				state.restoring = false;
			});
	},
});

export const { clearProcurementSupplierCurrent } = procurementSuppliersSlice.actions;

export const selectProcurementSuppliersItems = (state: RootState) =>
	state.procurementSuppliers.items;
export const selectProcurementSuppliersMeta = (state: RootState) => state.procurementSuppliers.meta;
export const selectProcurementSuppliersListLoading = (state: RootState) =>
	state.procurementSuppliers.listLoading;
export const selectProcurementSuppliersListError = (state: RootState) =>
	state.procurementSuppliers.listError;
export const selectProcurementSupplierCurrent = (state: RootState) =>
	state.procurementSuppliers.current;
export const selectProcurementSupplierCurrentLoading = (state: RootState) =>
	state.procurementSuppliers.currentLoading;
export const selectProcurementSupplierCurrentError = (state: RootState) =>
	state.procurementSuppliers.currentError;

export default procurementSuppliersSlice.reducer;
