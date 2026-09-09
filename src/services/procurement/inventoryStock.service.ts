import type {
	IApiCollectionEnvelope,
	IApiPaginationLinks,
	IApiPaginationMeta,
	IInventoryDocumentAllocation,
	IInventoryDocumentAllocationPayload,
	IInventoryLocationContext,
	IInventoryOriginsParams,
	IInventoryOriginsResponse,
	IInventoryStockListParams,
	IInventoryStockResponse,
	IInventoryStockRow,
	IPurchaseDocumentCompact,
	ISupplierCompact,
	IWarehouseCompact,
} from '@/interface/procurement.interface';
import {
	inventoryOriginFilterOptions,
	inventoryOrigins as inventoryOriginsSeed,
	inventoryWarehousesByBranch,
	resolveInventoryProduct,
	type IInventorySeedOrigin,
	type IInventorySeedRow,
} from '@/mocks/db/inventoryStock.db';
import {
	applyInitialStockAllocationCoverageDelta,
	bumpPurchaseDocumentInitialStockAllocationsCount,
	findPurchaseDocumentByLineId,
	findPurchaseDocumentForReceipts,
} from '@/services/procurement/purchaseDocuments.service';
import {
	clearAllPersistedMockState,
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';
import { PROCUREMENT_ERROR_DEFINITIONS } from '@/utils/procurementErrors.util';
import { normalizePageParams } from '@/utils/procurementPagination.util';

/**
 * Servicio mock de stock por ubicación — secciones 3 y 8 del contrato de
 * abastecimiento (`frontend-guide.md`, PR #67 del backend).
 *
 * **Ninguno de estos endpoints existe todavía.** Hasta la card 07 (ZF-112)
 * este servicio era de sólo lectura sobre los fixtures estáticos de
 * `inventoryStock.db`. Ahora mantiene un store mutable de procedencias
 * (`origins`), particionado por **sucursal** — a diferencia de
 * `stockReceipts.service`/`purchaseDocuments.service`, que particionan por
 * filial, porque `GET/POST B/inventory-stock/...` es un prefijo `B`
 * (sucursal), no `P` (filial) — con la misma disciplina de idempotencia y
 * persistencia en `localStorage` que el resto del módulo
 * (`procurementMockPersistence.util`, reutilizando su parámetro genérico de
 * partición como `branchId` en vez de `subsidiaryId`).
 *
 * `document-allocations` (sección 8) sí necesita `subsidiaryId` como
 * parámetro explícito además de `branchId`: el documento de compra que
 * respalda la asignación vive en el store de `purchaseDocuments.service`,
 * particionado por filial — mismo criterio que `stockReceipts.service`
 * necesitando `subsidiaryId` para resolver un documento aunque sus propias
 * recepciones sean de sucursal.
 */

const MOCK_LATENCY_MS = 120;
const apiError = (status: number, code: string, message: string): Error =>
	Object.assign(new Error(message), {
		isAxiosError: true as const,
		response: { status, data: { code, message } },
	});

const delay = <T>(value: T, signal?: AbortSignal): Promise<T> =>
	new Promise((resolve, reject) => {
		if (signal?.aborted) {
			reject(new DOMException('La solicitud fue cancelada.', 'AbortError'));
			return;
		}
		let timer: ReturnType<typeof setTimeout>;
		const onAbort = () => {
			clearTimeout(timer);
			reject(new DOMException('La solicitud fue cancelada.', 'AbortError'));
		};
		timer = setTimeout(() => {
			signal?.removeEventListener('abort', onAbort);
			resolve(structuredClone(value));
		}, MOCK_LATENCY_MS);
		signal?.addEventListener('abort', onAbort, { once: true });
	});

/* =================================================
   Store mutable de procedencias, particionado por sucursal
   ================================================= */

interface IInventoryStockBranchStore {
	origins: IInventorySeedOrigin[];
	/** Historial de asignaciones confirmadas — la lista relacionada del documento (sección 6/8). */
	allocations: IInventoryDocumentAllocation[];
}

const cloneOrigin = (origin: IInventorySeedOrigin): IInventorySeedOrigin => ({
	...origin,
	supplier: origin.supplier ? { ...origin.supplier } : null,
	purchase_document: origin.purchase_document ? { ...origin.purchase_document } : null,
});

const cloneAllocation = (
	allocation: IInventoryDocumentAllocation,
): IInventoryDocumentAllocation => ({
	...allocation,
	purchase_document: { ...allocation.purchase_document },
	supplier: allocation.supplier ? { ...allocation.supplier } : null,
	cost: { ...allocation.cost },
});

const storesByBranch = new Map<number, IInventoryStockBranchStore>();
const nextOriginIdByBranch = new Map<number, number>();
const nextAllocationIdByBranch = new Map<number, number>();

const seedNextOriginId = (): number =>
	Math.max(...inventoryOriginsSeed.map((origin) => origin.origin_id)) + 1;

const nextOriginIdFor = (branchId: number): number => {
	const current = nextOriginIdByBranch.get(branchId) ?? seedNextOriginId();
	nextOriginIdByBranch.set(branchId, current + 1);
	return current;
};

const nextAllocationIdFor = (branchId: number): number => {
	const current = nextAllocationIdByBranch.get(branchId) ?? 1;
	nextAllocationIdByBranch.set(branchId, current + 1);
	return current;
};

const INVENTORY_STOCK_STORAGE_NAMESPACE = 'inventory-stock';
const INVENTORY_STOCK_STORAGE_VERSION = 1;

interface IIdempotencyLogEntry {
	payloadHash: string;
	/** `undefined` mientras la operación sigue en curso. */
	result?: unknown;
}

interface IPersistedInventoryStockState {
	origins: IInventorySeedOrigin[];
	allocations: IInventoryDocumentAllocation[];
	nextOriginId: number;
	nextAllocationId: number;
	idempotency: [string, IIdempotencyLogEntry][];
}

const idempotencyLog = new Map<string, IIdempotencyLogEntry>();
const idempotencyLogKey = (branchId: number, key: string): string => `${branchId}:${key}`;

const persistBranchState = (branchId: number): void => {
	const store = storesByBranch.get(branchId);
	if (!store) return;

	const prefix = `${branchId}:`;
	const idempotency: [string, IIdempotencyLogEntry][] = [];
	idempotencyLog.forEach((entry, key) => {
		if (key.startsWith(prefix)) idempotency.push([key.slice(prefix.length), entry]);
	});

	const payload: IPersistedInventoryStockState = {
		origins: store.origins,
		allocations: store.allocations,
		nextOriginId: nextOriginIdByBranch.get(branchId) ?? seedNextOriginId(),
		nextAllocationId: nextAllocationIdByBranch.get(branchId) ?? 1,
		idempotency,
	};
	savePersistedMockState(
		INVENTORY_STOCK_STORAGE_NAMESPACE,
		INVENTORY_STOCK_STORAGE_VERSION,
		branchId,
		payload,
	);
};

const hydrateStoreFromStorage = (branchId: number): IInventoryStockBranchStore | null => {
	const persisted = loadPersistedMockState<IPersistedInventoryStockState>(
		INVENTORY_STOCK_STORAGE_NAMESPACE,
		INVENTORY_STOCK_STORAGE_VERSION,
		branchId,
	);
	if (!persisted) return null;

	nextOriginIdByBranch.set(branchId, persisted.nextOriginId);
	nextAllocationIdByBranch.set(branchId, persisted.nextAllocationId);
	persisted.idempotency.forEach(([key, entry]) => {
		idempotencyLog.set(idempotencyLogKey(branchId, key), entry);
	});

	return { origins: persisted.origins, allocations: persisted.allocations };
};

const seedStore = (branchId: number): IInventoryStockBranchStore => ({
	origins: inventoryOriginsSeed
		.filter((origin) => origin.branch_id === branchId)
		.map(cloneOrigin),
	allocations: [],
});

const getStore = (branchId: number): IInventoryStockBranchStore => {
	let store = storesByBranch.get(branchId);
	if (store === undefined) {
		store = hydrateStoreFromStorage(branchId) ?? seedStore(branchId);
		storesByBranch.set(branchId, store);
	}
	return store;
};

async function withIdempotency<T>(
	branchId: number,
	idempotencyKey: string | undefined,
	payloadForHash: unknown,
	run: () => Promise<T>,
): Promise<T> {
	if (!idempotencyKey) {
		const result = await run();
		persistBranchState(branchId);
		return result;
	}

	const logKey = idempotencyLogKey(branchId, idempotencyKey);
	const payloadHash = JSON.stringify(payloadForHash);
	const logged = idempotencyLog.get(logKey);
	if (logged) {
		if (logged.payloadHash !== payloadHash) {
			return Promise.reject(
				apiError(
					409,
					'IDEMPOTENCY_KEY_REUSED',
					PROCUREMENT_ERROR_DEFINITIONS.IDEMPOTENCY_KEY_REUSED.fallbackMessage,
				),
			);
		}
		if (!('result' in logged)) {
			return Promise.reject(
				apiError(
					409,
					'OPERATION_IN_PROGRESS',
					PROCUREMENT_ERROR_DEFINITIONS.OPERATION_IN_PROGRESS.fallbackMessage,
				),
			);
		}
		return logged.result as T;
	}

	idempotencyLog.set(logKey, { payloadHash });
	try {
		const result = await run();
		idempotencyLog.set(logKey, { payloadHash, result });
		persistBranchState(branchId);
		return result;
	} catch (error) {
		idempotencyLog.delete(logKey);
		throw error;
	}
}

/* =================================================
   Lectura — secciones 3 y 8 (context de ubicación, agregados, procedencias)
   ================================================= */

const locationContext = (
	branchId: number,
	params: IInventoryStockListParams,
): IInventoryLocationContext => {
	if (!Number.isInteger(branchId) || branchId <= 0)
		throw apiError(422, 'INVALID_FILTER', 'Selecciona una sucursal válida.');
	// Runtime validation also covers callers outside TypeScript (or persisted filters).
	if (params.warehouse_id !== undefined && params.unlocated !== undefined)
		throw apiError(422, 'INVALID_FILTER', 'Bodega y Sin ubicación son filtros excluyentes.');
	if (params.unlocated !== undefined && params.unlocated !== 1)
		throw apiError(422, 'INVALID_FILTER', 'El filtro Sin ubicación no es válido.');
	if ('warehouse_id' in params && params.warehouse_id !== undefined) {
		const warehouse = inventoryWarehousesByBranch[branchId]?.find(
			(item) => item.id === params.warehouse_id,
		);
		if (!warehouse)
			throw apiError(422, 'WAREHOUSE_INVALID', 'La bodega no pertenece a la sucursal.');
		return { scope: 'warehouse', branch_id: branchId, warehouse };
	}
	if ('unlocated' in params && params.unlocated === 1)
		return { scope: 'unlocated', branch_id: branchId, warehouse: null };
	return { scope: 'branch', branch_id: branchId, warehouse: null };
};

const matchesLocation = (
	row: { warehouse_id: number | null },
	context: IInventoryLocationContext,
): boolean =>
	context.scope === 'branch' ||
	(context.scope === 'unlocated'
		? row.warehouse_id === null
		: row.warehouse_id === context.warehouse?.id);

const page = <T>(items: T[], path: string, params: { page?: number; per_page?: number }) => {
	const { page: requestedPage, per_page: perPage } = normalizePageParams(params);
	const total = items.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(requestedPage, lastPage);
	const start = (currentPage - 1) * perPage;
	const data = items.slice(start, start + perPage);
	const links: IApiPaginationLinks = {
		first: '?page=1',
		last: `?page=${lastPage}`,
		prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
		next: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
	};
	const meta: IApiPaginationMeta = {
		current_page: currentPage,
		from: data.length ? start + 1 : null,
		last_page: lastPage,
		links: [],
		path,
		per_page: perPage,
		to: data.length ? start + data.length : null,
		total,
	};
	return { data, links, meta };
};

/**
 * Agrega procedencias vigentes del store mutable a filas de stock por
 * producto/ubicación (card 07, ZF-112): `documented_quantity`/
 * `undocumented_quantity` ya no se derivan estáticamente de un fixture — se
 * suman dinámicamente sobre `origins`, que cambia con cada
 * `document-allocations` confirmado. Mismo criterio de reduce que usaba
 * `inventoryStockRows` en `inventoryStock.db.ts`.
 */
const aggregateStockRows = (origins: readonly IInventorySeedOrigin[]): IInventorySeedRow[] => {
	const rows = new Map<string, IInventorySeedRow>();
	origins.forEach((origin) => {
		const product = resolveInventoryProduct(origin.product_id);
		// Defensivo: no debería ocurrir con fixtures/splits válidos — un origin
		// sin producto resoluble no puede pintarse como fila.
		if (!product) return;

		const key = `${origin.branch_id}:${origin.warehouse_id}:${origin.product_id}`;
		const row = rows.get(key) ?? {
			product,
			branch_id: origin.branch_id,
			warehouse_id: origin.warehouse_id,
			physical_quantity: 0,
			fit_quantity: 0,
			unfit_quantity: 0,
			documented_quantity: 0,
			undocumented_quantity: 0,
		};
		row.physical_quantity += origin.physical_quantity;
		row.fit_quantity += origin.fit_quantity;
		row.unfit_quantity += origin.unfit_quantity;
		if (origin.purchase_document) row.documented_quantity += origin.physical_quantity;
		else row.undocumented_quantity += origin.physical_quantity;
		rows.set(key, row);
	});
	return [...rows.values()];
};

export const getInventoryWarehouses = (branchId: number): IWarehouseCompact[] =>
	(inventoryWarehousesByBranch[branchId] ?? []).map((warehouse) => ({ ...warehouse }));

export const listInventoryStock = async (
	branchId: number,
	params: IInventoryStockListParams = {},
	signal?: AbortSignal,
): Promise<IInventoryStockResponse> => {
	let context: IInventoryLocationContext;
	try {
		context = locationContext(branchId, params);
	} catch (error) {
		return Promise.reject(error);
	}
	const search = params.search?.trim().toLocaleLowerCase() ?? '';
	const store = getStore(branchId);
	const rows = aggregateStockRows(store.origins)
		.filter((row) => matchesLocation(row, context) && !row.product.serial_tracking)
		.filter(
			(row) =>
				!search ||
				row.product.name.toLocaleLowerCase().includes(search) ||
				row.product.sku.toLocaleLowerCase().includes(search),
		);
	const products = new Map<number, IInventoryStockRow>();
	rows.forEach(({ branch_id: _branch, warehouse_id: _warehouse, ...row }) => {
		const previous = products.get(row.product.id);
		if (!previous) {
			products.set(row.product.id, { ...row });
			return;
		}
		previous.physical_quantity += row.physical_quantity;
		previous.fit_quantity += row.fit_quantity;
		previous.unfit_quantity += row.unfit_quantity;
		previous.documented_quantity += row.documented_quantity;
		previous.undocumented_quantity += row.undocumented_quantity;
	});
	const sortedRows = [...products.values()].sort(
		(a, b) => a.product.name.localeCompare(b.product.name) || a.product.id - b.product.id,
	);
	return delay(
		{ ...page(sortedRows, `/api/branches/${branchId}/inventory-stock`, params), context },
		signal,
	);
};

const originsFor = (
	branchId: number,
	productId: number,
	context: IInventoryLocationContext,
): IInventorySeedOrigin[] =>
	getStore(branchId).origins.filter(
		(origin) => origin.product_id === productId && matchesLocation(origin, context),
	);

export const getInventoryOriginFilterOptions = (
	branchId: number,
	productId: number,
	location: IInventoryStockListParams,
): { suppliers: ISupplierCompact[]; documents: IPurchaseDocumentCompact[] } => {
	const context = locationContext(branchId, location);
	const product = resolveInventoryProduct(productId);
	if (!product || product.serial_tracking) return { suppliers: [], documents: [] };
	return structuredClone(inventoryOriginFilterOptions(originsFor(branchId, productId, context)));
};

export const listInventoryOrigins = async (
	branchId: number,
	productId: number,
	params: IInventoryOriginsParams = {},
	signal?: AbortSignal,
): Promise<IInventoryOriginsResponse> => {
	const product = resolveInventoryProduct(productId);
	if (!product || product.serial_tracking)
		return Promise.reject(
			apiError(
				404,
				'INVENTORY_PRODUCT_NOT_FOUND',
				'El producto no tiene stock no serializado en esta sucursal.',
			),
		);
	let context: IInventoryLocationContext;
	try {
		context = locationContext(branchId, params);
	} catch (error) {
		return Promise.reject(error);
	}
	const origins = originsFor(branchId, productId, context)
		.filter(
			(origin) =>
				params.purchase_document_id === undefined ||
				origin.purchase_document?.id === params.purchase_document_id,
		)
		.filter(
			(origin) =>
				params.supplier_id === undefined || origin.supplier?.id === params.supplier_id,
		)
		.sort((a, b) => a.fifo_at - b.fifo_at || a.origin_id - b.origin_id)
		.map(
			({
				branch_id: _branch,
				warehouse_id: _warehouse,
				fifo_at: _fifo,
				product_id: _product,
				...origin
			}) => origin,
		);
	return delay(
		{
			...page(
				origins,
				`/api/branches/${branchId}/inventory-stock/${productId}/origins`,
				params,
			),
			context: { ...context, product },
		},
		signal,
	);
};

/* =================================================
   Documentar después sin volver a ingresar stock — sección 8
   ================================================= */

interface IMockWriteHeaders {
	idempotencyKey?: string;
}

/**
 * `POST B/inventory-stock/{product}/document-allocations` (card 07, sección
 * 8): respalda documentalmente stock inicial **todavía existente** y sin
 * documento. `physical_stock_delta` es siempre `0` — la operación divide un
 * origin en dos, nunca mueve ni crea unidades físicas.
 *
 * Decisiones no especificadas literalmente en el contrato (sección 8):
 * - **Origin sin saldo sin documentar** (no existe, o ya tiene
 *   `purchase_document`): se trata como `409 INSUFFICIENT_UNDOCUMENTED_STOCK`
 *   — el contrato exige rechazar «cantidad superior a saldo sin documentar»,
 *   y un origin ya documentado o inexistente tiene saldo `0`.
 * - **Capacidad de línea excedida**: se reutiliza `RECEIPT_EXCEEDS_DOCUMENT`
 *   — mismo código que usa `stockReceipts.service` para «la recepción supera
 *   lo pendiente del documento»; acá es la comprobación análoga para una
 *   asignación documental.
 * - **No documentar lo ya vendido**: este mock sólo modela stock físico
 *   existente — un origin únicamente vive en el store mientras tiene
 *   `physical_quantity > 0` (se elimina al agotarse por completo, más abajo
 *   en esta misma función). No hay una noción de «unidades vendidas» que
 *   modelar todavía: la limitación real es que un origin con saldo nunca
 *   representa unidades ya vendidas, no que exista una validación explícita
 *   de venta — documentarlo así en vez de fingir una validación que este
 *   mock no puede respaldar.
 */
export const createInventoryDocumentAllocation = (
	subsidiaryId: number,
	branchId: number,
	productId: number,
	payload: IInventoryDocumentAllocationPayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IInventoryDocumentAllocation }> =>
	withIdempotency(
		branchId,
		headers.idempotencyKey,
		{ action: 'document-allocation', subsidiaryId, productId, payload },
		async () => {
			if (!payload.reason?.trim()) {
				return Promise.reject(
					apiError(
						422,
						'ALLOCATION_REASON_REQUIRED',
						'Indica el motivo del respaldo documental.',
					),
				);
			}
			if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
				return Promise.reject(
					apiError(
						422,
						'ALLOCATION_QUANTITY_INVALID',
						'La cantidad debe ser un entero positivo.',
					),
				);
			}

			const store = getStore(branchId);
			const origin = store.origins.find(
				(item) =>
					item.origin_id === payload.origin_id &&
					item.product_id === productId &&
					item.warehouse_id === payload.warehouse_id,
			);
			// Saldo sin documentar: `0` si el origin no existe en esa ubicación o si
			// ya tiene documento — ambos casos son «no hay suficiente sin
			// respaldo», no un 404 aparte (sección 8, `INSUFFICIENT_UNDOCUMENTED_STOCK`).
			const undocumentedBalance =
				origin && !origin.purchase_document ? origin.physical_quantity : 0;
			if (!origin || payload.quantity > undocumentedBalance) {
				return Promise.reject(
					apiError(
						409,
						'INSUFFICIENT_UNDOCUMENTED_STOCK',
						PROCUREMENT_ERROR_DEFINITIONS.INSUFFICIENT_UNDOCUMENTED_STOCK
							.fallbackMessage,
					),
				);
			}

			const document = findPurchaseDocumentByLineId(
				subsidiaryId,
				payload.purchase_document_line_id,
			);
			if (!document) {
				return Promise.reject(
					apiError(
						422,
						'DOCUMENT_LINE_MISMATCH',
						PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
					),
				);
			}
			if (document.status !== 'confirmed') {
				return Promise.reject(
					apiError(
						422,
						'DOCUMENT_NOT_CONFIRMED',
						PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_NOT_CONFIRMED.fallbackMessage,
					),
				);
			}
			const line = document.items.find(
				(item) => item.id === payload.purchase_document_line_id,
			)!;
			if (line.product.id !== productId) {
				return Promise.reject(
					apiError(
						422,
						'DOCUMENT_LINE_MISMATCH',
						PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
					),
				);
			}
			if (payload.quantity > line.remaining_quantity) {
				return Promise.reject(
					apiError(
						422,
						'RECEIPT_EXCEEDS_DOCUMENT',
						PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_EXCEEDS_DOCUMENT.fallbackMessage,
					),
				);
			}

			// Split determinista fit-antes-de-unfit (sección 8): preserva
			// exactamente los saldos de condición, sin reclasificar unidades.
			const fitToDocument = Math.min(payload.quantity, origin.fit_quantity);
			const unfitToDocument = payload.quantity - fitToDocument;

			const documentCompact: IPurchaseDocumentCompact = {
				id: document.id,
				document_type: document.document_type,
				document_number: document.document_number,
				issue_date: document.issue_date,
			};
			const now = new Date().toISOString();
			const documentedOriginId = nextOriginIdFor(branchId);
			const documentedOrigin: IInventorySeedOrigin = {
				...origin,
				origin_id: documentedOriginId,
				physical_quantity: payload.quantity,
				fit_quantity: fitToDocument,
				unfit_quantity: unfitToDocument,
				purchase_document: documentCompact,
				supplier: document.supplier,
				// Conserva el mismo orden relativo que el origin original — no
				// salta al final de la cola FIFO (sección 8).
				fifo_at: origin.fifo_at,
			};

			const remainingPhysical = origin.physical_quantity - payload.quantity;
			const remainingOrigin: IInventorySeedOrigin | null =
				remainingPhysical > 0
					? {
							...origin,
							physical_quantity: remainingPhysical,
							fit_quantity: origin.fit_quantity - fitToDocument,
							unfit_quantity: origin.unfit_quantity - unfitToDocument,
						}
					: null;

			// Un origin con saldo cero no representa nada físico (comentario de
			// `createInventoryDocumentAllocation` de arriba): se retira del store
			// en vez de dejar una fila fantasma en 0.
			store.origins = [
				...store.origins.filter((item) => item.origin_id !== origin.origin_id),
				...(remainingOrigin ? [remainingOrigin] : []),
				documentedOrigin,
			];

			const allocation: IInventoryDocumentAllocation = {
				id: nextAllocationIdFor(branchId),
				product_id: productId,
				branch_id: branchId,
				warehouse_id: payload.warehouse_id,
				original_origin_id: origin.origin_id,
				documented_origin_id: documentedOriginId,
				quantity: payload.quantity,
				remaining_undocumented_quantity: remainingOrigin?.physical_quantity ?? 0,
				purchase_document: documentCompact,
				supplier: document.supplier,
				cost: line.cost,
				physical_stock_delta: 0,
				reason: payload.reason.trim(),
				created_at: now,
			};
			store.allocations = [...store.allocations, allocation];

			// Refleja la cobertura en el documento, exactamente como si esta
			// asignación hubiese existido desde que se confirmó — no crea
			// recepción ni suma `received_quantity` (sección 6/8).
			applyInitialStockAllocationCoverageDelta(
				subsidiaryId,
				document.id,
				line.id,
				payload.quantity,
			);
			bumpPurchaseDocumentInitialStockAllocationsCount(subsidiaryId, document.id, 1);

			return delay({ data: cloneAllocation(allocation) });
		},
	);

/**
 * `GET .../purchase-documents/{document}/initial-stock-allocations` (sección
 * 6, card 07): lista relacionada paginada, servida desde **este** store — el
 * único que posee asignaciones reales — para que `purchaseDocuments.service`
 * no necesite importar este módulo (mismo criterio que
 * `listStockReceiptsForPurchaseDocument`, hallazgo 9 de ZF-110).
 * `subsidiaryId` sólo se usa para confirmar que el documento existe en esa
 * filial (404 si no) y para el `path` cosmético del `meta`: las asignaciones
 * mismas están particionadas por sucursal, no por filial.
 */
export const listInitialStockAllocationsForPurchaseDocument = async (
	subsidiaryId: number,
	documentId: number,
	params: { page?: number; per_page?: number } = {},
): Promise<IApiCollectionEnvelope<IInventoryDocumentAllocation>> => {
	if (!findPurchaseDocumentForReceipts(subsidiaryId, documentId)) {
		return Promise.reject(
			apiError(404, 'PURCHASE_DOCUMENT_NOT_FOUND', 'El documento de compra no existe.'),
		);
	}

	const allocations = [...storesByBranch.values()]
		.flatMap((store) => store.allocations)
		.filter((allocation) => allocation.purchase_document.id === documentId)
		.sort((a, b) => b.id - a.id);

	const result = page(
		allocations,
		`/api/subsidiaries/${subsidiaryId}/procurement/purchase-documents/${documentId}/initial-stock-allocations`,
		params,
	);
	return delay({ ...result, data: result.data.map(cloneAllocation) });
};

/**
 * Sólo para pruebas: descarta el estado **en memoria** — como una recarga
 * real de la pestaña — pero conserva lo persistido en `localStorage`, mismo
 * criterio que el resto del módulo.
 */
export const simulateInventoryStockReloadForTests = (): void => {
	storesByBranch.clear();
	nextOriginIdByBranch.clear();
	nextAllocationIdByBranch.clear();
	idempotencyLog.clear();
};

/** Sólo para pruebas: reinicia el store a la semilla de fixtures, incluida la persistencia. */
export const resetInventoryStockStoreForTests = (): void => {
	simulateInventoryStockReloadForTests();
	clearAllPersistedMockState(INVENTORY_STOCK_STORAGE_NAMESPACE);
};
