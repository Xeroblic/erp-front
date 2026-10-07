import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
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
 * `subsidiaryId` viaja en cada thunk porque el contrato ata el RUT único a la
 * filial (`/api/subsidiaries/{subsidiary}/procurement/suppliers`). Las
 * escrituras exigen `headers.idempotencyKey`: el backend rechaza una escritura
 * sin ella.
 */

export interface ProcurementSuppliersState {
	items: IProcurementSupplierListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	listRequestId: string | null;
	/**
	 * Filial a la que pertenecen `items`, `meta` y `listError`. La pantalla
	 * compara con la filial vigente: al cambiarla, lo cargado para la
	 * anterior deja de mostrarse desde el primer render, sin esperar la
	 * nueva respuesta.
	 */
	listSubsidiaryId: number | null;
	current: IProcurementSupplier | null;
	currentLoading: boolean;
	currentError: string | null;
	/** Filial y proveedor dueños de `current`/`currentError`, mismo criterio que `listSubsidiaryId`. */
	currentSubsidiaryId: number | null;
	currentSupplierId: number | null;
	/** Descarta la respuesta tardía de una ficha anterior que llega después de pedir la siguiente. */
	currentRequestId: string | null;
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
	listRequestId: null,
	listSubsidiaryId: null,
	current: null,
	currentLoading: false,
	currentError: null,
	currentSubsidiaryId: null,
	currentSupplierId: null,
	currentRequestId: null,
	creating: false,
	updating: false,
	deactivating: false,
	restoring: false,
};

interface IWriteHeaders {
	idempotencyKey: string;
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
			return await listProcurementSuppliers(args.subsidiaryId, args.params);
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
			const { data } = await getProcurementSupplier(args.subsidiaryId, args.id);
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
			headers: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await createProcurementSupplier(
				args.subsidiaryId,
				args.payload,
				args.headers,
			);
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
			headers: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await updateProcurementSupplier(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
			);
			return data;
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

/**
 * `DELETE` es 204 sin cuerpo: el thunk sólo puede devolver el `id`. El slice
 * no adivina `allowed_actions` a partir de eso; quien necesite la ficha fresca
 * la vuelve a pedir con `fetchProcurementSupplierDetail`.
 */
export const deactivateProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/deactivate',
	async (
		args: { subsidiaryId: number | null; id: number; headers: IWriteHeaders },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			await deactivateProcurementSupplier(args.subsidiaryId, args.id, args.headers);
			return { id: args.id };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const restoreProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/restore',
	async (
		args: { subsidiaryId: number | null; id: number; headers: IWriteHeaders },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const { data } = await restoreProcurementSupplier(
				args.subsidiaryId,
				args.id,
				args.headers,
			);
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

const belongsToList = (state: ProcurementSuppliersState, subsidiaryId: number | null) =>
	subsidiaryId !== null && subsidiaryId === state.listSubsidiaryId;

const belongsToCurrent = (
	state: ProcurementSuppliersState,
	subsidiaryId: number | null,
	id: number,
) =>
	state.current?.id === id && subsidiaryId !== null && subsidiaryId === state.currentSubsidiaryId;

/**
 * Refleja en `items` y `current` el resultado de una escritura, sin refetch.
 * `subsidiaryId` es el de la propia mutación: una escritura resuelta después
 * de cambiar de filial no puede pisar la lista o la ficha de la nueva sólo
 * porque el ID coincide.
 */
const applySupplierMutation = (
	state: ProcurementSuppliersState,
	supplier: IProcurementSupplier,
	subsidiaryId: number | null,
) => {
	if (belongsToList(state, subsidiaryId)) {
		state.items = state.items.map((row) =>
			row.id === supplier.id ? toListRow(supplier) : row,
		);
	}
	if (belongsToCurrent(state, subsidiaryId, supplier.id)) state.current = supplier;
};

const procurementSuppliersSlice = createSlice({
	name: 'procurementSuppliers',
	initialState,
	reducers: {
		clearProcurementSupplierCurrent(state) {
			state.current = null;
			state.currentError = null;
			state.currentSubsidiaryId = null;
			state.currentSupplierId = null;
			// Sin esto, una respuesta en vuelo de la ficha que se abandona
			// podría llegar tarde y repoblar `current`.
			state.currentRequestId = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProcurementSuppliers.pending, (state, action) => {
				state.listLoading = true;
				state.listError = null;
				state.listRequestId = action.meta.requestId;
			})
			.addCase(fetchProcurementSuppliers.fulfilled, (state, action) => {
				// Una respuesta que no es la de la última petición pedida es tardía
				// (filtro/página cambiados mientras viajaba): se descarta.
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				state.items = action.payload.data;
				state.meta = action.payload.meta;
				state.listSubsidiaryId = action.meta.arg.subsidiaryId;
			})
			.addCase(fetchProcurementSuppliers.rejected, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				// Un fallo en otra filial no deja a la vista las filas de la anterior.
				if (state.listSubsidiaryId !== action.meta.arg.subsidiaryId) {
					state.items = [];
					state.meta = null;
				}
				state.listSubsidiaryId = action.meta.arg.subsidiaryId;
				state.listError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el listado.',
				);
			})

			.addCase(fetchProcurementSupplierDetail.pending, (state, action) => {
				state.currentLoading = true;
				state.currentError = null;
				state.currentRequestId = action.meta.requestId;
			})
			.addCase(fetchProcurementSupplierDetail.fulfilled, (state, action) => {
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.current = action.payload;
				state.currentSubsidiaryId = action.meta.arg.subsidiaryId;
				state.currentSupplierId = action.meta.arg.id;
			})
			.addCase(fetchProcurementSupplierDetail.rejected, (state, action) => {
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.currentError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el proveedor.',
				);
				state.current = null;
				state.currentSubsidiaryId = action.meta.arg.subsidiaryId;
				state.currentSupplierId = action.meta.arg.id;
			})

			.addCase(createProcurementSupplierThunk.pending, (state) => {
				state.creating = true;
			})
			.addCase(createProcurementSupplierThunk.fulfilled, (state) => {
				state.creating = false;
				// La lista se refresca desde el hook, que conoce página y filtros.
			})
			.addCase(createProcurementSupplierThunk.rejected, (state) => {
				state.creating = false;
			})

			.addCase(updateProcurementSupplierThunk.pending, (state) => {
				state.updating = true;
			})
			.addCase(updateProcurementSupplierThunk.fulfilled, (state, action) => {
				state.updating = false;
				applySupplierMutation(state, action.payload, action.meta.arg.subsidiaryId);
			})
			.addCase(updateProcurementSupplierThunk.rejected, (state) => {
				state.updating = false;
			})

			.addCase(deactivateProcurementSupplierThunk.pending, (state) => {
				state.deactivating = true;
			})
			.addCase(deactivateProcurementSupplierThunk.fulfilled, (state, action) => {
				state.deactivating = false;
				// Sin ficha que aplicar (204): sólo se sabe que `is_active` pasó a
				// `false`; `allowed_actions` llega con el próximo `fetch`.
				const { id } = action.payload;
				const { subsidiaryId } = action.meta.arg;
				if (belongsToList(state, subsidiaryId)) {
					state.items = state.items.map((row) =>
						row.id === id ? { ...row, is_active: false } : row,
					);
				}
				if (state.current && belongsToCurrent(state, subsidiaryId, id))
					state.current = { ...state.current, is_active: false };
			})
			.addCase(deactivateProcurementSupplierThunk.rejected, (state) => {
				state.deactivating = false;
			})

			.addCase(restoreProcurementSupplierThunk.pending, (state) => {
				state.restoring = true;
			})
			.addCase(restoreProcurementSupplierThunk.fulfilled, (state, action) => {
				state.restoring = false;
				applySupplierMutation(state, action.payload, action.meta.arg.subsidiaryId);
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
export const selectProcurementSuppliersListSubsidiaryId = (state: RootState) =>
	state.procurementSuppliers.listSubsidiaryId;
export const selectProcurementSupplierCurrent = (state: RootState) =>
	state.procurementSuppliers.current;
export const selectProcurementSupplierCurrentLoading = (state: RootState) =>
	state.procurementSuppliers.currentLoading;
export const selectProcurementSupplierCurrentError = (state: RootState) =>
	state.procurementSuppliers.currentError;
export const selectProcurementSupplierCurrentSubsidiaryId = (state: RootState) =>
	state.procurementSuppliers.currentSubsidiaryId;
export const selectProcurementSupplierCurrentSupplierId = (state: RootState) =>
	state.procurementSuppliers.currentSupplierId;

export default procurementSuppliersSlice.reducer;
