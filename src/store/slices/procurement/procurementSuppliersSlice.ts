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
 * Store del maestro de proveedores (card 02 del módulo de abastecimiento,
 * sección 5 del contrato). Los thunks llaman al servicio mock de
 * `@/services/procurement/procurementSuppliers.service`: el día que el
 * endpoint exista, sólo ese servicio cambia.
 *
 * `subsidiaryId` viaja en cada thunk y se reenvía al servicio: el contrato
 * ata el RUT único a la filial
 * (`/api/subsidiaries/{subsidiary}/procurement/suppliers`), y el mock
 * particiona su store por filial por la misma razón — dos filiales no ven ni
 * pisan los proveedores de la otra.
 */

export interface ProcurementSuppliersState {
	items: IProcurementSupplierListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	/** `requestId` de la última petición de listado en curso o resuelta. */
	listRequestId: string | null;
	current: IProcurementSupplier | null;
	currentLoading: boolean;
	currentError: string | null;
	/**
	 * `requestId` de la última petición de ficha en curso o resuelta. Descarta
	 * una respuesta tardía de una ficha anterior (proveedor previo, filial
	 * previa) que llega después de que ya se pidió la siguiente: sin esto, un
	 * `fetch` lento de la ficha A puede resolver después que uno más rápido de
	 * la ficha B y pisarla con datos de A.
	 */
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
	current: null,
	currentLoading: false,
	currentError: null,
	currentRequestId: null,
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
			headers?: IWriteHeaders;
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
			headers?: IWriteHeaders;
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
 * `DELETE` es 204 sin cuerpo (sección 5): el thunk no tiene ficha que
 * devolver, así que el resultado interno es sólo el `id` que se desactivó.
 * El slice no adivina `allowed_actions` a partir de eso — quien necesite la
 * ficha fresca la vuelve a pedir con `fetchProcurementSupplierDetail`.
 */
export const deactivateProcurementSupplierThunk = createAsyncThunk(
	'procurementSuppliers/deactivate',
	async (
		args: { subsidiaryId: number | null; id: number; headers?: IWriteHeaders },
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
		args: { subsidiaryId: number | null; id: number; headers?: IWriteHeaders },
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
			// Sin esto, una respuesta en vuelo de la ficha que se está
			// abandonando podría seguir llegando y repoblar `current` después
			// de limpiarlo: la próxima carga necesita su propio `requestId`.
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
			})
			.addCase(fetchProcurementSuppliers.rejected, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
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
				// Propiedad de contexto (ZF-12): una ficha anterior que resuelve
				// tarde no puede pisar la que el usuario está viendo ahora.
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.current = action.payload;
			})
			.addCase(fetchProcurementSupplierDetail.rejected, (state, action) => {
				if (action.meta.requestId !== state.currentRequestId) return;
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
				// Sin ficha que aplicar (204): sólo se sabe con certeza que
				// `is_active` pasó a `false`. `allowed_actions` no se adivina acá —
				// lo decide el backend y llega recién con el próximo `fetch`.
				const { id } = action.payload;
				state.items = state.items.map((row) =>
					row.id === id ? { ...row, is_active: false } : row,
				);
				if (state.current?.id === id)
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
