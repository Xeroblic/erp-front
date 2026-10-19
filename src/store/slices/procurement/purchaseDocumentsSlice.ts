import { createAsyncThunk, createSlice, isFulfilled } from '@reduxjs/toolkit';
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
import {
	MISSING_SUBSIDIARY_MESSAGE,
	mutationBelongsToCurrent,
	mutationBelongsToList,
} from '@/utils/procurementWrite.util';

/**
 * Documentos de compra. Se guarda el `ETag` del recurso junto con `current`:
 * la edición (`PATCH`) lo necesita para `If-Match`, y sólo la ficha ya cargada
 * lo tiene.
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

/** Intento documental que sobrevive al cierre del modal, acotado a filial y documento. */
export interface IPurchaseDocumentWriteAttempt {
	resourceKey: string;
	subsidiaryId: number;
	documentId: number | null;
	idempotencyKey: string;
	etag: string | null;
	payload: IPurchaseDocumentCreatePayload;
	/** El PATCH omite proveedor si no cambió, incluso al reintentar. */
	omitSupplier: boolean;
	/**
	 * Flete tal como lo dejó el usuario: el cuerpo lo envía `null` si estaba
	 * marcado sin monto válido, y reconstruirlo desde ahí lo desmarcaría.
	 */
	includeShipping: boolean;
	shippingCostInput: string;
	status: 'in_flight' | 'uncertain' | 'completed' | 'rejected';
	result: IPurchaseDocument | null;
	/** Rechazo definitivo que llegó sin el formulario a la vista, para mostrarlo al volver. */
	rejection: IPurchaseDocumentWriteRejection | null;
}

export interface IPurchaseDocumentWriteRejection {
	message: string;
	fieldErrors: Record<string, string[]> | null;
	isVersionConflict: boolean;
}

export interface PurchaseDocumentsState {
	items: IPurchaseDocumentListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	listRequestId: string | null;
	/**
	 * Filial dueña de `items`/`meta`/`listError`. Se fija al resolver, no al
	 * pedir: mientras la petición de otra filial vuela, lo guardado sigue siendo
	 * de la anterior y el hook no lo muestra. Tampoco deja que una mutación de
	 * otra filial parchee la lista.
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
	/**
	 * Altas de producto en línea sin cerrar, una por filial, desde que empieza
	 * el `POST`. Viven acá y no en el modal que las hizo: el modal se desmonta
	 * (cambio de filial en la ficha, salida de la página) y, si el intento se
	 * perdiera con él, al volver se podría enviar otro y duplicar el producto.
	 */
	pendingProductAttempts: Record<number, TProductAttemptRecord>;
	pendingDocumentWrites: Record<string, IPurchaseDocumentWriteAttempt>;
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
	pendingProductAttempts: {},
	pendingDocumentWrites: {},
};

/** La `Idempotency-Key` es obligatoria: el backend rechaza escrituras sin ella. */
interface IWriteHeaders {
	idempotencyKey: string;
}

/** El PATCH además necesita el `ETag` de la ficha que se editó. */
interface IUpdateHeaders extends IWriteHeaders {
	etag: string | null;
}

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
	if (mutationBelongsToList(state, subsidiaryId)) {
		state.items = state.items.map((row) =>
			row.id === document.id ? toListRow(document) : row,
		);
	}
	if (mutationBelongsToCurrent(state, subsidiaryId, document.id)) {
		state.current = document;
		state.currentEtag = etag;
	}
};

const purchaseDocumentsSlice = createSlice({
	name: 'purchaseDocuments',
	initialState,
	reducers: {
		setDocumentWriteAttempt(state, action: PayloadAction<IPurchaseDocumentWriteAttempt>) {
			state.pendingDocumentWrites ??= {};
			state.pendingDocumentWrites[action.payload.resourceKey] = action.payload;
		},
		completeDocumentWriteAttempt(
			state,
			action: PayloadAction<{
				resourceKey: string;
				idempotencyKey: string;
				result: IPurchaseDocument;
			}>,
		) {
			const attempt = state.pendingDocumentWrites?.[action.payload.resourceKey];
			if (attempt?.idempotencyKey !== action.payload.idempotencyKey) return;
			attempt.status = 'completed';
			attempt.result = action.payload.result;
		},
		clearDocumentWriteAttempt(
			state,
			action: PayloadAction<{ resourceKey: string; idempotencyKey: string }>,
		) {
			if (
				state.pendingDocumentWrites?.[action.payload.resourceKey]?.idempotencyKey ===
				action.payload.idempotencyKey
			)
				delete state.pendingDocumentWrites[action.payload.resourceKey];
		},
		clearPurchaseDocumentCurrent(state) {
			state.current = null;
			state.currentEtag = null;
			state.currentError = null;
			state.currentSubsidiaryId = null;
			state.currentDocumentId = null;
			// Sin esto, una respuesta en vuelo de la ficha que se abandona
			// podría llegar tarde y repoblar `current`.
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
		/** Se creó sin quien lo reciba: el modal se desmontó o su borrador se descartó. */
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
				// Una ficha anterior que resuelve tarde no puede pisar la vigente.
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
			.addMatcher(
				isFulfilled(
					updatePurchaseDocumentThunk,
					confirmPurchaseDocumentThunk,
					cancelPurchaseDocumentThunk,
				),
				(state, action) => {
					applyDocumentMutation(
						state,
						action.payload.data,
						action.payload.etag,
						action.payload.subsidiaryId,
					);
				},
			);
	},
});

export const {
	setDocumentWriteAttempt,
	completeDocumentWriteAttempt,
	clearDocumentWriteAttempt,
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

export const selectPurchaseDocumentCurrentSubsidiaryId = (state: RootState) =>
	state.purchaseDocuments.currentSubsidiaryId;
export const selectPurchaseDocumentCurrentDocumentId = (state: RootState) =>
	state.purchaseDocuments.currentDocumentId;

export const selectPendingProductAttempt = (
	state: RootState,
	subsidiaryId: number | null,
): TProductAttemptRecord | null =>
	subsidiaryId === null
		? null
		: (state.purchaseDocuments.pendingProductAttempts[subsidiaryId] ?? null);

export default purchaseDocumentsSlice.reducer;
