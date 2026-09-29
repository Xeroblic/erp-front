import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
	cancelPurchaseDocument,
	confirmPurchaseDocument,
	createPurchaseDocument,
	getPurchaseDocument,
	listPurchaseDocuments,
	updatePurchaseDocument,
} from '@/services/procurement/purchaseDocuments.service';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type {
	ICreatedPurchasableProduct,
	IPendingProductAttempt,
} from '@/services/procurement/purchasableProducts.service';
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
 * Store de documentos de compra (sección 6 del contrato). Mismo patrón que
 * `procurementSuppliersSlice`: los thunks llaman al servicio real
 * `@/services/procurement/purchaseDocuments.service` (backend PR #84/#92).
 *
 * A diferencia de proveedores, acá se guarda el `ETag` del recurso junto con
 * `current`: la edición (`PATCH`) lo necesita para `If-Match`, y sólo la
 * ficha ya cargada lo tiene — no hay otro lugar del store de donde sacarlo.
 */

/**
 * Alta de producto en línea que todavía no se puede dar por cerrada:
 * - `in_flight`: el `POST` (o su conciliación) está en curso.
 * - `uncertain`: falló sin decir qué pasó; «Reintentar» lo concilia.
 * - `created`: se creó después de que el modal que lo pidió se desmontara;
 *   queda para entregarlo en la línea cuando el modal vuelva a abrirse.
 */
export type TProductAttemptRecord =
	| (IPendingProductAttempt & { status: 'in_flight' | 'uncertain' })
	| (IPendingProductAttempt & { status: 'created'; product: ICreatedPurchasableProduct });

export interface PurchaseDocumentsState {
	items: IPurchaseDocumentListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	listRequestId: string | null;
	/**
	 * Filial dueña de `items`/`meta`/`listError` (propiedad de contexto,
	 * ZF-12). Se fija al resolver, no al pedir: mientras la petición de otra
	 * filial vuela, lo guardado sigue siendo de la anterior y el hook no lo
	 * muestra. Tampoco deja que una mutación de otra filial parchee la lista.
	 */
	listSubsidiaryId: number | null;
	current: IPurchaseDocument | null;
	/** `ETag` de `current`, tal como lo devolvió el último GET o escritura. */
	currentEtag: string | null;
	currentLoading: boolean;
	currentError: string | null;
	currentRequestId: string | null;
	/** Filial dueña de `current`/`currentError`, mismo criterio que `listSubsidiaryId`. */
	currentSubsidiaryId: number | null;
	/** Documento pedido por la carga que dejó `current`/`currentError`. */
	currentDocumentId: number | null;
	creating: boolean;
	updating: boolean;
	confirming: boolean;
	cancelling: boolean;
	/**
	 * Altas de producto en línea sin cerrar, una por filial, desde que empieza
	 * el `POST`. Viven acá y no en el modal que las hizo: el modal se desmonta
	 * (cambio de filial en la ficha, salida de la página) y, si el intento se
	 * perdiera con él, al volver se podría enviar otro y duplicar el producto.
	 */
	pendingProductAttempts: Record<number, TProductAttemptRecord>;
}

const initialState: PurchaseDocumentsState = {
	items: [],
	meta: null,
	listLoading: false,
	listError: null,
	listRequestId: null,
	listSubsidiaryId: null,
	current: null,
	currentEtag: null,
	currentLoading: false,
	currentError: null,
	currentRequestId: null,
	currentSubsidiaryId: null,
	currentDocumentId: null,
	creating: false,
	updating: false,
	confirming: false,
	cancelling: false,
	pendingProductAttempts: {},
};

/** La `Idempotency-Key` es obligatoria: el backend rechaza escrituras sin ella. */
interface IWriteHeaders {
	idempotencyKey: string;
}

/** El PATCH además necesita el `ETag` de la ficha que se editó. */
interface IUpdateHeaders extends IWriteHeaders {
	etag: string | null;
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
			return { data: response.data, etag: response.headers.etag };
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
			headers: IWriteHeaders;
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
			return {
				data: response.data,
				etag: response.headers.etag,
				subsidiaryId: args.subsidiaryId,
			};
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
			headers: IUpdateHeaders;
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
			return {
				data: response.data,
				etag: response.headers.etag,
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const confirmPurchaseDocumentThunk = createAsyncThunk(
	'purchaseDocuments/confirm',
	async (
		args: { subsidiaryId: number | null; id: number; headers: IWriteHeaders },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await confirmPurchaseDocument(
				args.subsidiaryId,
				args.id,
				args.headers,
			);
			return {
				data: response.data,
				etag: response.headers.etag,
				subsidiaryId: args.subsidiaryId,
			};
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
			headers: IWriteHeaders;
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
			return {
				data: response.data,
				etag: response.headers.etag,
				subsidiaryId: args.subsidiaryId,
			};
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

/**
 * Refleja en `items` y `current` el resultado de una escritura, sin refetch.
 * `subsidiaryId` es el de la propia mutación: sin compararlo, una escritura
 * resuelta después de cambiar de filial podría pisar la lista o la ficha de
 * la filial nueva.
 */
const applyDocumentMutation = (
	state: PurchaseDocumentsState,
	document: IPurchaseDocument,
	etag: string | null,
	subsidiaryId: number | null,
) => {
	if (subsidiaryId !== null && subsidiaryId === state.listSubsidiaryId) {
		state.items = state.items.map((row) =>
			row.id === document.id ? toListRow(document) : row,
		);
	}
	if (
		state.current?.id === document.id &&
		subsidiaryId !== null &&
		subsidiaryId === state.currentSubsidiaryId
	) {
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
			state.currentSubsidiaryId = null;
			state.currentDocumentId = null;
			// Igual que en proveedores: sin esto, una respuesta en vuelo de la
			// ficha que se abandona podría llegar tarde y repoblar `current`.
			state.currentRequestId = null;
		},
		/** Empieza el `POST` de un alta o su conciliación. */
		startProductAttempt(state, action: PayloadAction<IPendingProductAttempt>) {
			state.pendingProductAttempts[action.payload.subsidiaryId] = {
				...action.payload,
				status: 'in_flight',
			};
		},
		markProductAttemptUncertain(state, action: PayloadAction<number>) {
			const attempt = state.pendingProductAttempts[action.payload];
			if (attempt?.status === 'in_flight') attempt.status = 'uncertain';
		},
		/** Se creó sin un modal montado que lo reciba. */
		completeProductAttempt(
			state,
			action: PayloadAction<{ subsidiaryId: number; product: ICreatedPurchasableProduct }>,
		) {
			const attempt = state.pendingProductAttempts[action.payload.subsidiaryId];
			if (!attempt) return;
			state.pendingProductAttempts[action.payload.subsidiaryId] = {
				subsidiaryId: attempt.subsidiaryId,
				payload: attempt.payload,
				status: 'created',
				product: action.payload.product,
			};
		},
		/** Se cerró: la filial del intento, no la activa. */
		clearPendingProductAttempt(state, action: PayloadAction<number>) {
			delete state.pendingProductAttempts[action.payload];
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
				state.listSubsidiaryId = action.meta.arg.subsidiaryId;
			})
			.addCase(fetchPurchaseDocuments.rejected, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				// Un fallo en otra filial no deja guardadas las filas de la anterior.
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
				state.currentSubsidiaryId = action.meta.arg.subsidiaryId;
				state.currentDocumentId = action.meta.arg.id;
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
				state.currentSubsidiaryId = action.meta.arg.subsidiaryId;
				state.currentDocumentId = action.meta.arg.id;
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
				applyDocumentMutation(
					state,
					action.payload.data,
					action.payload.etag,
					action.payload.subsidiaryId,
				);
			})
			.addCase(updatePurchaseDocumentThunk.rejected, (state) => {
				state.updating = false;
			})

			.addCase(confirmPurchaseDocumentThunk.pending, (state) => {
				state.confirming = true;
			})
			.addCase(confirmPurchaseDocumentThunk.fulfilled, (state, action) => {
				state.confirming = false;
				applyDocumentMutation(
					state,
					action.payload.data,
					action.payload.etag,
					action.payload.subsidiaryId,
				);
			})
			.addCase(confirmPurchaseDocumentThunk.rejected, (state) => {
				state.confirming = false;
			})

			.addCase(cancelPurchaseDocumentThunk.pending, (state) => {
				state.cancelling = true;
			})
			.addCase(cancelPurchaseDocumentThunk.fulfilled, (state, action) => {
				state.cancelling = false;
				applyDocumentMutation(
					state,
					action.payload.data,
					action.payload.etag,
					action.payload.subsidiaryId,
				);
			})
			.addCase(cancelPurchaseDocumentThunk.rejected, (state) => {
				state.cancelling = false;
			});
	},
});

export const {
	clearPurchaseDocumentCurrent,
	startProductAttempt,
	markProductAttemptUncertain,
	completeProductAttempt,
	clearPendingProductAttempt,
} = purchaseDocumentsSlice.actions;

export const selectPurchaseDocumentsItems = (state: RootState) => state.purchaseDocuments.items;
export const selectPurchaseDocumentsMeta = (state: RootState) => state.purchaseDocuments.meta;
export const selectPurchaseDocumentsListLoading = (state: RootState) =>
	state.purchaseDocuments.listLoading;
export const selectPurchaseDocumentsListError = (state: RootState) =>
	state.purchaseDocuments.listError;
export const selectPurchaseDocumentsListSubsidiaryId = (state: RootState) =>
	state.purchaseDocuments.listSubsidiaryId;
export const selectPurchaseDocumentCurrent = (state: RootState) => state.purchaseDocuments.current;
export const selectPurchaseDocumentCurrentEtag = (state: RootState) =>
	state.purchaseDocuments.currentEtag;
export const selectPurchaseDocumentCurrentLoading = (state: RootState) =>
	state.purchaseDocuments.currentLoading;
export const selectPurchaseDocumentCurrentError = (state: RootState) =>
	state.purchaseDocuments.currentError;

/** Filial y documento de la carga que dejó la ficha (o su error) en el store. */
export const selectPurchaseDocumentCurrentSubsidiaryId = (state: RootState) =>
	state.purchaseDocuments.currentSubsidiaryId;
export const selectPurchaseDocumentCurrentDocumentId = (state: RootState) =>
	state.purchaseDocuments.currentDocumentId;

/** Alta de producto sin cerrar en la filial dada, si la hay. */
export const selectPendingProductAttempt = (
	state: RootState,
	subsidiaryId: number | null,
): TProductAttemptRecord | null =>
	subsidiaryId === null
		? null
		: (state.purchaseDocuments.pendingProductAttempts[subsidiaryId] ?? null);

export default purchaseDocumentsSlice.reducer;
