import { createAsyncThunk, createSlice, isFulfilled } from '@reduxjs/toolkit';
import {
	cancelStockReceipt,
	createStockReceipt,
	getStockReceipt,
	linkStockReceiptPurchaseDocument,
	listStockReceipts,
	postStockReceipt,
	retryStockReceipt,
	reverseStockReceipt,
	updateStockReceipt,
} from '@/services/procurement/stockReceipts.service';
import {
	MISSING_SUBSIDIARY_MESSAGE,
	mutationBelongsToCurrent,
	mutationBelongsToList,
	readEtagHeader,
} from '@/utils/procurementWrite.util';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type { RootState } from '@/store';
import type {
	IApiPaginationMeta,
	IProcurementActorCompact,
	IStockReceipt,
	IStockReceiptCancelPayload,
	IStockReceiptCreatePayload,
	IStockReceiptLinkPurchaseDocumentPayload,
	IStockReceiptListParams,
	IStockReceiptListRow,
	IStockReceiptReversePayload,
	IStockReceiptUpdatePayload,
} from '@/interface/procurement.interface';

/**
 * Recepciones físicas, particionadas por filial. Guarda el `ETag` de `current`
 * para el `If-Match` de `update`. Mientras `current.status === 'queued'` el
 * detalle se vuelve a pedir en bucle, pero ese polling vive en
 * `useRecepcionDetalle`: el slice sólo expone el thunk.
 */

export interface StockReceiptsState {
	items: IStockReceiptListRow[];
	meta: IApiPaginationMeta | null;
	listLoading: boolean;
	listError: string | null;
	listRequestId: string | null;
	/** Filial dueña de `items`/`meta`. */
	listSubsidiaryId: number | null;
	current: IStockReceipt | null;
	/** `ETag` de `current`, tal como lo devolvió el último GET o escritura. */
	currentEtag: string | null;
	currentLoading: boolean;
	currentError: string | null;
	currentRequestId: string | null;
	/** Filial dueña de `current`, mismo criterio que `listSubsidiaryId`. */
	currentSubsidiaryId: number | null;
}

const initialState: StockReceiptsState = {
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
};

interface IWriteHeaders {
	idempotencyKey?: string;
	etag?: string | null;
}

export const fetchStockReceipts = createAsyncThunk(
	'stockReceipts/fetchList',
	async (
		args: { subsidiaryId: number | null; params?: IStockReceiptListParams },
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			return await listStockReceipts(args.subsidiaryId, args.params);
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const fetchStockReceiptDetail = createAsyncThunk(
	'stockReceipts/fetchDetail',
	async (args: { subsidiaryId: number | null; id: number }, { rejectWithValue }) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await getStockReceipt(args.subsidiaryId, args.id);
			return { data: response.data, etag: readEtagHeader(response.headers) };
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const createStockReceiptThunk = createAsyncThunk(
	'stockReceipts/create',
	async (
		args: {
			subsidiaryId: number | null;
			payload: IStockReceiptCreatePayload;
			headers?: IWriteHeaders;
			/** Sucursales autorizadas del actor; `null`/vacío no filtra. */
			authorizedBranchIds?: number[] | null;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await createStockReceipt(
				args.subsidiaryId,
				args.payload,
				args.headers,
				args.authorizedBranchIds,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const updateStockReceiptThunk = createAsyncThunk(
	'stockReceipts/update',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IStockReceiptUpdatePayload;
			headers: IWriteHeaders;
			/** Sucursales autorizadas del actor; `null`/vacío no filtra. */
			authorizedBranchIds?: number[] | null;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await updateStockReceipt(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
				args.authorizedBranchIds,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const cancelStockReceiptThunk = createAsyncThunk(
	'stockReceipts/cancel',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IStockReceiptCancelPayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await cancelStockReceipt(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const postStockReceiptThunk = createAsyncThunk(
	'stockReceipts/post',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			actor: IProcurementActorCompact;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await postStockReceipt(
				args.subsidiaryId,
				args.id,
				args.actor,
				args.headers,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const retryStockReceiptThunk = createAsyncThunk(
	'stockReceipts/retry',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			actor: IProcurementActorCompact;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await retryStockReceipt(
				args.subsidiaryId,
				args.id,
				args.actor,
				args.headers,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

export const reverseStockReceiptThunk = createAsyncThunk(
	'stockReceipts/reverse',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IStockReceiptReversePayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await reverseStockReceipt(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

/** `PUT .../purchase-document`: vinculación posterior a un documento de compra. */
export const linkStockReceiptPurchaseDocumentThunk = createAsyncThunk(
	'stockReceipts/linkPurchaseDocument',
	async (
		args: {
			subsidiaryId: number | null;
			id: number;
			payload: IStockReceiptLinkPurchaseDocumentPayload;
			headers?: IWriteHeaders;
		},
		{ rejectWithValue },
	) => {
		if (args.subsidiaryId === null) return rejectWithValue(MISSING_SUBSIDIARY_MESSAGE);
		try {
			const response = await linkStockReceiptPurchaseDocument(
				args.subsidiaryId,
				args.id,
				args.payload,
				args.headers,
			);
			return {
				data: response.data,
				etag: readEtagHeader(response.headers),
				subsidiaryId: args.subsidiaryId,
			};
		} catch (error) {
			return rejectWithValue(error);
		}
	},
);

const toListRow = (receipt: IStockReceipt): IStockReceiptListRow => ({
	id: receipt.id,
	subsidiary_id: receipt.subsidiary_id,
	branch_id: receipt.branch_id,
	status: receipt.status,
	warehouse: receipt.warehouse,
	supplier: receipt.supplier,
	purchase_document: receipt.purchase_document,
	received_on: receipt.received_on,
	items_count: receipt.items_count,
	total_quantity: receipt.total_quantity,
	created_at: receipt.created_at,
	posted_at: receipt.posted_at,
	allowed_actions: receipt.allowed_actions,
});

/**
 * Refleja en `items` y `current` el resultado de una escritura, sin refetch.
 * Igual criterio de propiedad de contexto que `applyDocumentMutation`: una
 * mutación resuelta para otra filial no puede pisar `current` sólo porque el
 * ID coincide (el mock siembra los mismos IDs en cada filial).
 */
const applyReceiptMutation = (
	state: StockReceiptsState,
	receipt: IStockReceipt,
	etag: string | null,
	subsidiaryId: number | null,
) => {
	if (mutationBelongsToList(state, subsidiaryId)) {
		state.items = state.items.map((row) => (row.id === receipt.id ? toListRow(receipt) : row));
	}
	if (mutationBelongsToCurrent(state, subsidiaryId, receipt.id)) {
		state.current = receipt;
		state.currentEtag = etag;
	}
};

const stockReceiptsSlice = createSlice({
	name: 'stockReceipts',
	initialState,
	reducers: {
		clearStockReceiptCurrent(state) {
			state.current = null;
			state.currentEtag = null;
			state.currentError = null;
			state.currentSubsidiaryId = null;
			// Sin esto, una respuesta en vuelo de la ficha que se abandona
			// podría llegar tarde y repoblar `current`.
			state.currentRequestId = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchStockReceipts.pending, (state, action) => {
				state.listLoading = true;
				state.listError = null;
				state.listRequestId = action.meta.requestId;
				state.listSubsidiaryId = action.meta.arg.subsidiaryId;
				// Un GET rechazado para la filial entrante no debe dejar ver los
				// datos de la saliente por debajo del error.
				state.items = [];
				state.meta = null;
			})
			.addCase(fetchStockReceipts.fulfilled, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				state.items = action.payload.data;
				state.meta = action.payload.meta;
			})
			.addCase(fetchStockReceipts.rejected, (state, action) => {
				if (action.meta.requestId !== state.listRequestId) return;
				state.listLoading = false;
				state.listError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar el listado.',
				);
			})

			.addCase(fetchStockReceiptDetail.pending, (state, action) => {
				state.currentRequestId = action.meta.requestId;
				state.currentSubsidiaryId = action.meta.arg.subsidiaryId;
				// El polling reusa este mismo thunk: sólo la primera carga muestra
				// el spinner de página completa. Reintentar tras un GET fallido sí
				// vuelve a mostrarlo, para que «Reintentar» dé feedback visible.
				if (state.current === null || state.currentError !== null)
					state.currentLoading = true;
				state.currentError = null;
			})
			.addCase(fetchStockReceiptDetail.fulfilled, (state, action) => {
				// Una ficha anterior que resuelve tarde no puede pisar la vigente.
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.current = action.payload.data;
				state.currentEtag = action.payload.etag;
			})
			.addCase(fetchStockReceiptDetail.rejected, (state, action) => {
				if (action.meta.requestId !== state.currentRequestId) return;
				state.currentLoading = false;
				state.currentError = getProcurementErrorMessage(
					action.payload,
					'No se pudo cargar la recepción.',
				);
				state.current = null;
				state.currentEtag = null;
				state.currentSubsidiaryId = null;
			})
			.addMatcher(
				isFulfilled(
					updateStockReceiptThunk,
					cancelStockReceiptThunk,
					postStockReceiptThunk,
					retryStockReceiptThunk,
					reverseStockReceiptThunk,
					linkStockReceiptPurchaseDocumentThunk,
				),
				(state, action) => {
					applyReceiptMutation(
						state,
						action.payload.data,
						action.payload.etag,
						action.payload.subsidiaryId,
					);
				},
			);
	},
});

export const { clearStockReceiptCurrent } = stockReceiptsSlice.actions;

export const selectStockReceiptsItems = (state: RootState) => state.stockReceipts.items;
export const selectStockReceiptsMeta = (state: RootState) => state.stockReceipts.meta;
export const selectStockReceiptsListLoading = (state: RootState) => state.stockReceipts.listLoading;
export const selectStockReceiptsListError = (state: RootState) => state.stockReceipts.listError;
export const selectStockReceiptsListSubsidiaryId = (state: RootState) =>
	state.stockReceipts.listSubsidiaryId;
export const selectStockReceiptCurrent = (state: RootState) => state.stockReceipts.current;
export const selectStockReceiptCurrentEtag = (state: RootState) => state.stockReceipts.currentEtag;
export const selectStockReceiptCurrentLoading = (state: RootState) =>
	state.stockReceipts.currentLoading;
export const selectStockReceiptCurrentError = (state: RootState) =>
	state.stockReceipts.currentError;

export default stockReceiptsSlice.reducer;
