import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
	cancelPurchaseDocument,
	confirmPurchaseDocument,
	createPurchaseDocument,
	getPurchaseDocument,
	listPurchaseDocuments,
	updatePurchaseDocument,
} from '@/services/procurement/purchaseDocuments.service';
import { readEtagHeader } from '@/utils/procurementWrite.util';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type { RootState } from '@/store';
import type {
	IApiPaginationMeta,
	IPurchaseDocument,
	IPurchaseDocumentCancelPayload,
	IPurchaseDocumentCreatePayload,
	IPurchaseDocumentListParams,
	IPurchaseDocumentListRow,
	IPurchaseDocumentUpdatePayload,
} from '@/interface/procurement.interface';

/**
 * Store de documentos de compra (card 03, sección 6 del contrato). Mismo
 * patrón que `procurementSuppliersSlice`: los thunks llaman al servicio mock
 * de `@/services/procurement/purchaseDocuments.service`, particionado por
 * filial.
 *
 * A diferencia de proveedores, acá se guarda el `ETag` del recurso junto con
 * `current`: la edición (`PATCH`) lo necesita para `If-Match`, y sólo la
 * ficha ya cargada lo tiene — no hay otro lugar del store de donde sacarlo.
 */

export interface PurchaseDocumentsState {
	items: IPurchaseDocumentListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	listRequestId: string | null;
	current: IPurchaseDocument | null;
	/** `ETag` de `current`, tal como lo devolvió el último GET o escritura. */
	currentEtag: string | null;
	currentLoading: boolean;
	currentError: string | null;
	currentRequestId: string | null;
	creating: boolean;
	updating: boolean;
	confirming: boolean;
	cancelling: boolean;
}

const initialState: PurchaseDocumentsState = {
	items: [],
	meta: null,
	listLoading: false,
	listError: null,
	listRequestId: null,
	current: null,
	currentEtag: null,
	currentLoading: false,
	currentError: null,
	currentRequestId: null,
	creating: false,
	updating: false,
	confirming: false,
	cancelling: false,
};

interface IWriteHeaders {
	idempotencyKey?: string;
	etag?: string | null;
}

const MISSING_SUBSIDIARY_MESSAGE = 'No se pudo determinar la filial activa.';

export const fetchPurchaseDocuments = createAsyncThunk(
	'purchaseDocuments/fetchList',
	async (
		args: { subsidiaryId: number | null; params?: IPurchaseDocumentListParams },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			return await listPurchaseDocuments(args.subsidiaryId, args.params);
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const fetchPurchaseDocumentDetail = createAsyncThunk(
	'purchaseDocuments/fetchDetail',
	async (args: { subsidiaryId: number | null; id: number }, { rejectWithValue }) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await getPurchaseDocument(args.subsidiaryId, args.id);
			return { data: response.data, etag: readEtagHeader(response.headers) };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const createPurchaseDocumentThunk = createAsyncThunk(
	'purchaseDocuments/create',
	async (
		args: {
			subsidiaryId: number | null;
			payload: IPurchaseDocumentCreatePayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await createPurchaseDocument(
				args.subsidiaryId,
				args.payload,
				args.headers,
			);
			return { data: response.data, etag: readEtagHeader(response.headers) };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const updatePurchaseDocumentThunk = createAsyncThunk(
	'purchaseDocuments/update',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IPurchaseDocumentUpdatePayload;
			headers: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await updatePurchaseDocument(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
			);
			return { data: response.data, etag: readEtagHeader(response.headers) };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const confirmPurchaseDocumentThunk = createAsyncThunk(
	'purchaseDocuments/confirm',
	async (
		args: { subsidiaryId: number | null; id: number; headers?: IWriteHeaders },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await confirmPurchaseDocument(
				args.subsidiaryId,
				args.id,
				args.headers,
			);
			return { data: response.data, etag: readEtagHeader(response.headers) };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const cancelPurchaseDocumentThunk = createAsyncThunk(
	'purchaseDocuments/cancel',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IPurchaseDocumentCancelPayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await cancelPurchaseDocument(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
			);
			return { data: response.data, etag: readEtagHeader(response.headers) };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

const toListRow = (document: IPurchaseDocument): IPurchaseDocumentListRow => ({
	id: document.id,
	document_type: document.document_type,
	document_number: document.document_number,
	issue_date: document.issue_date,
	currency_code: document.currency_code,
	total_amount: document.total_amount,
	status: document.status,
	reception_status: document.reception_status,
	supplier: document.supplier,
	items_count: document.items_count,
	created_at: document.created_at,
	allowed_actions: document.allowed_actions,
});

/** Refleja en `items` y `current` el resultado de una escritura, sin refetch. */
const applyDocumentMutation = (
	state: PurchaseDocumentsState,
	document: IPurchaseDocument,
	etag: string | null,
) => {
	state.items = state.items.map((row) => (row.id === document.id ? toListRow(document) : row));
	if (state.current?.id === document.id) {
		state.current = document;
		state.currentEtag = etag;
	}
};

const purchaseDocumentsSlice = createSlice({
	name: 'purchaseDocuments',
	initialState,
	reducers: {
		clearPurchaseDocumentCurrent(state) {
			state.current = null;
			state.currentEtag = null;
			state.currentError = null;
			// Igual que en proveedores: sin esto, una respuesta en vuelo de la
			// ficha que se abandona podría llegar tarde y repoblar `current`.
			state.currentRequestId = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPurchaseDocuments.pending, (state, action) => {
				state.listLoading = true;
				state.listError = null;
				state.listRequestId = action.meta.requestId;
			})
			.addCase(fetchPurchaseDocuments.fulfilled, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				state.items = action.payload.data;
				state.meta = action.payload.meta;
			})
			.addCase(fetchPurchaseDocuments.rejected, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				state.listError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el listado.',
				);
			})

			.addCase(fetchPurchaseDocumentDetail.pending, (state, action) => {
				state.currentLoading = true;
				state.currentError = null;
				state.currentRequestId = action.meta.requestId;
			})
			.addCase(fetchPurchaseDocumentDetail.fulfilled, (state, action) => {
				// Propiedad de contexto (ZF-12): una ficha anterior que resuelve
				// tarde no puede pisar la que el usuario está viendo ahora.
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.current = action.payload.data;
				state.currentEtag = action.payload.etag;
			})
			.addCase(fetchPurchaseDocumentDetail.rejected, (state, action) => {
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.currentError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el documento.',
				);
				state.current = null;
				state.currentEtag = null;
			})

			.addCase(createPurchaseDocumentThunk.pending, (state) => {
				state.creating = true;
			})
			.addCase(createPurchaseDocumentThunk.fulfilled, (state) => {
				state.creating = false;
				// La lista se refresca desde el hook, igual que en proveedores.
			})
			.addCase(createPurchaseDocumentThunk.rejected, (state) => {
				state.creating = false;
			})

			.addCase(updatePurchaseDocumentThunk.pending, (state) => {
				state.updating = true;
			})
			.addCase(updatePurchaseDocumentThunk.fulfilled, (state, action) => {
				state.updating = false;
				applyDocumentMutation(state, action.payload.data, action.payload.etag);
			})
			.addCase(updatePurchaseDocumentThunk.rejected, (state) => {
				state.updating = false;
			})

			.addCase(confirmPurchaseDocumentThunk.pending, (state) => {
				state.confirming = true;
			})
			.addCase(confirmPurchaseDocumentThunk.fulfilled, (state, action) => {
				state.confirming = false;
				applyDocumentMutation(state, action.payload.data, action.payload.etag);
			})
			.addCase(confirmPurchaseDocumentThunk.rejected, (state) => {
				state.confirming = false;
			})

			.addCase(cancelPurchaseDocumentThunk.pending, (state) => {
				state.cancelling = true;
			})
			.addCase(cancelPurchaseDocumentThunk.fulfilled, (state, action) => {
				state.cancelling = false;
				applyDocumentMutation(state, action.payload.data, action.payload.etag);
			})
			.addCase(cancelPurchaseDocumentThunk.rejected, (state) => {
				state.cancelling = false;
			});
	},
});

export const { clearPurchaseDocumentCurrent } = purchaseDocumentsSlice.actions;

export const selectPurchaseDocumentsItems = (state: RootState) => state.purchaseDocuments.items;
export const selectPurchaseDocumentsMeta = (state: RootState) => state.purchaseDocuments.meta;
export const selectPurchaseDocumentsListLoading = (state: RootState) =>
	state.purchaseDocuments.listLoading;
export const selectPurchaseDocumentsListError = (state: RootState) =>
	state.purchaseDocuments.listError;
export const selectPurchaseDocumentCurrent = (state: RootState) => state.purchaseDocuments.current;
export const selectPurchaseDocumentCurrentEtag = (state: RootState) =>
	state.purchaseDocuments.currentEtag;
export const selectPurchaseDocumentCurrentLoading = (state: RootState) =>
	state.purchaseDocuments.currentLoading;
export const selectPurchaseDocumentCurrentError = (state: RootState) =>
	state.purchaseDocuments.currentError;

export default purchaseDocumentsSlice.reducer;
