import type {
	IApiCollectionEnvelope,
	IApiPaginationLinks,
	IApiPaginationMeta,
	IInventoryAdjustment,
	IInventoryAdjustmentItem,
	IInventoryAdjustmentPayload,
	IInventoryDocumentAllocation,
	IInventoryDocumentAllocationPayload,
	IInventoryLocationContext,
	IInventoryOriginsParams,
	IInventoryOriginsResponse,
	IInventoryStockListParams,
	IInventoryStockResponse,
	IInventoryStockRow,
	IProcurementProduct,
	IPurchaseDocumentCompact,
	ISupplierCompact,
	IWarehouseCompact,
	IWarehouseStockMovement,
	IWarehouseStockMovementItem,
	IWarehouseStockMovementPayload,
	TStockCondition,
} from '@/interface/procurement.interface';
import {
	inventoryAdjustableProducts,
	inventoryOriginFilterOptions,
	inventoryOrigins as inventoryOriginsSeed,
	inventoryStockHolds,
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
	/** Traslados internos confirmados (card 08, sección 9). */
	movements: IWarehouseStockMovement[];
	/** Ajustes por conteo confirmados (card 08, sección 11). */
	adjustments: IInventoryAdjustment[];
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
/**
 * v2 (card 08, ZF-113): el estado persistido gana `movements` y `adjustments`.
 * La clave de `procurementMockPersistence.util` incluye la versión, así que un
 * estado v1 deja de encontrarse y el store vuelve a la semilla — no hay
 * migración que escribir, pero el bump es obligatorio para no hidratar un
 * objeto al que le faltan los arreglos nuevos.
 */
const INVENTORY_STOCK_STORAGE_VERSION = 2;

interface IIdempotencyLogEntry {
	payloadHash: string;
	/** `undefined` mientras la operación sigue en curso. */
	result?: unknown;
}

interface IPersistedInventoryStockState {
	origins: IInventorySeedOrigin[];
	allocations: IInventoryDocumentAllocation[];
	movements: IWarehouseStockMovement[];
	adjustments: IInventoryAdjustment[];
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
		movements: store.movements,
		adjustments: store.adjustments,
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

	return {
		origins: persisted.origins,
		allocations: persisted.allocations,
		movements: persisted.movements,
		adjustments: persisted.adjustments,
	};
};

const seedStore = (branchId: number): IInventoryStockBranchStore => ({
	origins: inventoryOriginsSeed
		.filter((origin) => origin.branch_id === branchId)
		.map(cloneOrigin),
	allocations: [],
	movements: [],
	adjustments: [],
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

/**
 * Catálogo corregible por un ajuste: los no serializados de la filial, con
 * saldo o sin él. No es una vista del stock — es el catálogo — porque un
 * conteo que encuentra unidades de un producto que quedó en cero tiene que
 * poder nombrarlo (sección 11).
 */
export const getInventoryAdjustableProducts = (): IProcurementProduct[] =>
	inventoryAdjustableProducts.map((product) => ({ ...product }));

/**
 * Disponible de un producto en la **sucursal completa**, frente a las reservas
 * vigentes. No es un endpoint del contrato: es el dato mínimo que la card
 * exige poder mostrar —«un conteo real sí puede dejar el disponible global
 * negativo frente a holds: eso se muestra como faltante, no se oculta»— y que
 * un backend real devolvería junto al stock.
 *
 * Tres decisiones deliberadas:
 * - **`available` no se trunca en cero.** Un disponible de −2 es exactamente
 *   la información que la operación necesita: hay dos unidades comprometidas
 *   que no existen. Mostrar 0 escondería el problema.
 * - **Las reservas son de la sucursal, no de una bodega.** Un compromiso de
 *   venta no elige estante; repartirlo entre bodegas inventaría un dato que
 *   no existe.
 * - **El ajuste no las modifica.** Corrige el físico; cancelar compromisos es
 *   otra operación, fuera del alcance de esta card.
 */
export interface IInventoryStockAvailability {
	product_id: number;
	/** Físico de la sucursal completa, sumando todas sus ubicaciones. */
	physical_quantity: number;
	fit_quantity: number;
	reserved_quantity: number;
	/** `fit - reserved`. Negativo significa faltante frente a lo reservado. */
	available_quantity: number;
}

export const getInventoryStockAvailability = (
	branchId: number,
	productId: number,
): IInventoryStockAvailability => {
	const origins = getStore(branchId).origins.filter((origin) => origin.product_id === productId);
	const physical = origins.reduce((total, origin) => total + origin.physical_quantity, 0);
	const fit = origins.reduce((total, origin) => total + origin.fit_quantity, 0);
	const reserved = inventoryStockHolds
		.filter((hold) => hold.branch_id === branchId && hold.product_id === productId)
		.reduce((total, hold) => total + hold.reserved_quantity, 0);
	return {
		product_id: productId,
		physical_quantity: physical,
		fit_quantity: fit,
		reserved_quantity: reserved,
		available_quantity: fit - reserved,
	};
};

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

/* =================================================
   Traslado interno y ajuste por conteo — secciones 9 y 11

   Ambas escrituras mutan el **mismo** store de procedencias que las secciones
   3 y 8, así que viven acá y no en un servicio aparte: un traslado que no
   moviera los `origins` reales dejaría a `StockPorUbicacion` mostrando saldos
   que ninguna otra pantalla podría reproducir.
   ================================================= */

const STOCK_CONDITIONS: readonly TStockCondition[] = ['fit', 'unfit'];

const conditionQuantityOf = (origin: IInventorySeedOrigin, condition: TStockCondition): number =>
	condition === 'fit' ? origin.fit_quantity : origin.unfit_quantity;

/**
 * Aplica un delta a **una sola** condición y al físico. Nunca toca la otra
 * condición: traslados y ajustes tienen prohibida la reclasificación
 * (secciones 9 y 11), así que la operación que la haría posible no existe.
 */
const withConditionDelta = (
	origin: IInventorySeedOrigin,
	condition: TStockCondition,
	delta: number,
): IInventorySeedOrigin =>
	condition === 'fit'
		? {
				...origin,
				physical_quantity: origin.physical_quantity + delta,
				fit_quantity: origin.fit_quantity + delta,
			}
		: {
				...origin,
				physical_quantity: origin.physical_quantity + delta,
				unfit_quantity: origin.unfit_quantity + delta,
			};

const originsAt = (
	origins: readonly IInventorySeedOrigin[],
	productId: number,
	warehouseId: number | null,
): IInventorySeedOrigin[] =>
	origins.filter(
		(origin) => origin.product_id === productId && origin.warehouse_id === warehouseId,
	);

/** Mismo orden que `listInventoryOrigins`: FIFO por `fifo_at`, desempate por id. */
const fifoOrder = (a: IInventorySeedOrigin, b: IInventorySeedOrigin): number =>
	a.fifo_at - b.fifo_at || a.origin_id - b.origin_id;

const conditionBalanceAt = (
	origins: readonly IInventorySeedOrigin[],
	productId: number,
	warehouseId: number | null,
	condition: TStockCondition,
	restrictOriginId?: number | null,
): number =>
	originsAt(origins, productId, warehouseId)
		.filter(
			(origin) =>
				restrictOriginId === undefined ||
				restrictOriginId === null ||
				origin.origin_id === restrictOriginId,
		)
		.reduce((total, origin) => total + conditionQuantityOf(origin, condition), 0);

interface ILocationTotals {
	physical: number;
	fit: number;
	unfit: number;
}

const locationTotalsAt = (
	origins: readonly IInventorySeedOrigin[],
	productId: number,
	warehouseId: number | null,
): ILocationTotals =>
	originsAt(origins, productId, warehouseId).reduce<ILocationTotals>(
		(totals, origin) => ({
			physical: totals.physical + origin.physical_quantity,
			fit: totals.fit + origin.fit_quantity,
			unfit: totals.unfit + origin.unfit_quantity,
		}),
		{ physical: 0, fit: 0, unfit: 0 },
	);

/**
 * `null` es «Sin ubicación», una ubicación válida de **toda** sucursal: no se
 * valida contra el catálogo de bodegas. Una bodega de otra sucursal sí se
 * rechaza — es el criterio de aceptación «una ubicación de otra sucursal no
 * aparece como destino elegible», comprobado también acá y no sólo en la UI.
 */
const branchWarehouseError = (branchId: number, warehouseId: number | null): Error | null => {
	if (warehouseId === null) return null;
	const belongs = (inventoryWarehousesByBranch[branchId] ?? []).some(
		(warehouse) => warehouse.id === warehouseId,
	);
	return belongs
		? null
		: apiError(422, 'WAREHOUSE_INVALID', 'La bodega no pertenece a la sucursal.');
};

interface ITakenChunk {
	/** Snapshot del origin **antes** de descontar: conserva la procedencia a replicar. */
	origin: IInventorySeedOrigin;
	quantity: number;
}

/**
 * Descuenta `quantity` unidades de una condición en una ubicación, en orden
 * FIFO, y devuelve el arreglo resultante junto con las porciones tomadas.
 *
 * Un origin que queda en cero físico **se retira** del arreglo en vez de
 * quedar como fila fantasma — mismo criterio que
 * `createInventoryDocumentAllocation`. El saldo se valida antes de llamar acá,
 * así que `pending` siempre llega a cero.
 */
const takeFromLocation = (
	working: readonly IInventorySeedOrigin[],
	productId: number,
	warehouseId: number | null,
	condition: TStockCondition,
	quantity: number,
	restrictOriginId?: number | null,
): { origins: IInventorySeedOrigin[]; taken: ITakenChunk[] } => {
	const candidates = originsAt(working, productId, warehouseId)
		.filter(
			(origin) =>
				restrictOriginId === undefined ||
				restrictOriginId === null ||
				origin.origin_id === restrictOriginId,
		)
		.filter((origin) => conditionQuantityOf(origin, condition) > 0)
		.sort(fifoOrder);

	let pending = quantity;
	const taken: ITakenChunk[] = [];
	const patched = new Map<number, IInventorySeedOrigin | null>();

	candidates.forEach((origin) => {
		if (pending === 0) return;
		const chunk = Math.min(conditionQuantityOf(origin, condition), pending);
		pending -= chunk;
		taken.push({ origin, quantity: chunk });
		const next = withConditionDelta(origin, condition, -chunk);
		patched.set(origin.origin_id, next.physical_quantity > 0 ? next : null);
	});

	const origins = working
		.map((origin) => (patched.has(origin.origin_id) ? patched.get(origin.origin_id)! : origin))
		.filter((origin): origin is IInventorySeedOrigin => origin !== null);
	return { origins, taken };
};

/**
 * Identidad documental de un origin. Dos origins con la misma clave son la
 * misma procedencia y se fusionan al llegar a una ubicación: sin esto, mover
 * cinco unidades de ida y vuelta dejaría cuatro filas donde el contrato
 * describe una, y `listInventoryOrigins` mostraría una procedencia partida sin
 * que nada la haya partido.
 */
const provenanceKey = (origin: IInventorySeedOrigin): string =>
	JSON.stringify([
		origin.origin_type,
		origin.stock_receipt_id,
		origin.received_on,
		origin.supplier?.id ?? null,
		origin.purchase_document?.id ?? null,
		origin.fifo_at,
	]);

/**
 * Coloca las porciones tomadas en la ubicación destino conservando procedencia
 * y prioridad FIFO (`fifo_at` viaja intacto: el traslado no rejuvenece stock).
 */
const placeAtLocation = (
	working: readonly IInventorySeedOrigin[],
	branchId: number,
	productId: number,
	warehouseId: number | null,
	condition: TStockCondition,
	chunks: readonly ITakenChunk[],
): IInventorySeedOrigin[] => {
	let origins: IInventorySeedOrigin[] = [...working];
	chunks.forEach(({ origin: source, quantity }) => {
		const key = provenanceKey(source);
		const existing = originsAt(origins, productId, warehouseId).find(
			(candidate) => provenanceKey(candidate) === key,
		);
		if (existing) {
			const merged = withConditionDelta(existing, condition, quantity);
			origins = origins.map((candidate) =>
				candidate.origin_id === existing.origin_id ? merged : candidate,
			);
			return;
		}
		origins = [
			...origins,
			{
				...source,
				origin_id: nextOriginIdFor(branchId),
				warehouse_id: warehouseId,
				physical_quantity: quantity,
				fit_quantity: condition === 'fit' ? quantity : 0,
				unfit_quantity: condition === 'unfit' ? quantity : 0,
			},
		];
	});
	return origins;
};

/**
 * `POST B/warehouse-stock-movements` (card 08, sección 9): mueve unidades
 * entre ubicaciones de **la misma sucursal**.
 *
 * `global_stock_delta` es siempre `0` y las unidades cuentan **una vez**
 * aunque la operación tenga dos efectos — el criterio de aceptación explícito
 * de la card: un traslado de 5 se lee como 5, nunca como 10.
 *
 * Decisiones no especificadas literalmente en el contrato (sección 9):
 * - **Par `(product_id, condition)` repetido** en el mismo traslado: 422. El
 *   contrato describe un ítem por producto y condición; dos líneas del mismo
 *   par serían una sola cantidad escrita dos veces, y el saldo «después» de la
 *   primera contradiría al de la segunda.
 * - **Origen igual a destino**: 422 con código propio del mock. La tabla §16
 *   no tiene un código para esto porque el contrato lo enuncia como invariante
 *   («origen/destino distintos»), no como error tabulado.
 * - La validación es **completa antes de mutar**: el contrato describe una
 *   operación atómica, así que un traslado de tres líneas con la tercera sin
 *   saldo no puede dejar las dos primeras aplicadas.
 */
export const createWarehouseStockMovement = (
	branchId: number,
	payload: IWarehouseStockMovementPayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IWarehouseStockMovement }> =>
	withIdempotency(
		branchId,
		headers.idempotencyKey,
		{ action: 'warehouse-stock-movement', branchId, payload },
		async () => {
			if (payload.from_warehouse_id === payload.to_warehouse_id) {
				return Promise.reject(
					apiError(
						422,
						'MOVEMENT_SAME_LOCATION',
						'El origen y el destino deben ser ubicaciones distintas.',
					),
				);
			}
			const invalidWarehouse =
				branchWarehouseError(branchId, payload.from_warehouse_id) ??
				branchWarehouseError(branchId, payload.to_warehouse_id);
			if (invalidWarehouse) return Promise.reject(invalidWarehouse);

			if (!payload.reason?.trim()) {
				return Promise.reject(
					apiError(422, 'MOVEMENT_REASON_REQUIRED', 'Indica el motivo del traslado.'),
				);
			}
			if (!payload.items?.length) {
				return Promise.reject(
					apiError(
						422,
						'MOVEMENT_ITEMS_REQUIRED',
						'Agrega al menos un producto al traslado.',
					),
				);
			}

			// El `reduce` conserva el primer error y no lo pisa con los siguientes:
			// la respuesta describe el motivo por el que la operación se detuvo,
			// no el último problema que quedó por revisar.
			const seenItems = new Set<string>();
			const itemError = payload.items.reduce<Error | null>((found, item) => {
				if (found) return found;
				if (!Number.isInteger(item.quantity) || item.quantity <= 0)
					return apiError(
						422,
						'MOVEMENT_QUANTITY_INVALID',
						'La cantidad debe ser un entero positivo.',
					);
				if (!STOCK_CONDITIONS.includes(item.condition))
					return apiError(
						422,
						'MOVEMENT_CONDITION_REQUIRED',
						'Indica si las unidades son aptas o no aptas.',
					);
				const key = `${item.product_id}:${item.condition}`;
				if (seenItems.has(key))
					return apiError(
						422,
						'MOVEMENT_DUPLICATE_ITEM',
						'Hay dos líneas del mismo producto y condición: únelas en una.',
					);
				seenItems.add(key);
				return null;
			}, null);
			if (itemError) return Promise.reject(itemError);

			const store = getStore(branchId);
			const insufficient = payload.items.some(
				(item) =>
					item.quantity >
					conditionBalanceAt(
						store.origins,
						item.product_id,
						payload.from_warehouse_id,
						item.condition,
					),
			);
			if (insufficient) {
				return Promise.reject(
					apiError(
						409,
						'INSUFFICIENT_LOCATION_STOCK',
						PROCUREMENT_ERROR_DEFINITIONS.INSUFFICIENT_LOCATION_STOCK.fallbackMessage,
					),
				);
			}

			let working: IInventorySeedOrigin[] = store.origins;
			payload.items.forEach((item) => {
				const { origins, taken } = takeFromLocation(
					working,
					item.product_id,
					payload.from_warehouse_id,
					item.condition,
					item.quantity,
				);
				working = placeAtLocation(
					origins,
					branchId,
					item.product_id,
					payload.to_warehouse_id,
					item.condition,
					taken,
				);
			});
			store.origins = working;

			const items: IWarehouseStockMovementItem[] = payload.items.map((item) => ({
				product_id: item.product_id,
				quantity: item.quantity,
				condition: item.condition,
				origin_quantity_after: conditionBalanceAt(
					working,
					item.product_id,
					payload.from_warehouse_id,
					item.condition,
				),
				destination_quantity_after: conditionBalanceAt(
					working,
					item.product_id,
					payload.to_warehouse_id,
					item.condition,
				),
			}));

			const movement: IWarehouseStockMovement = {
				id: crypto.randomUUID(),
				operation_type: 'warehouse_stock_placement',
				branch_id: branchId,
				from_warehouse_id: payload.from_warehouse_id,
				to_warehouse_id: payload.to_warehouse_id,
				reason: payload.reason.trim(),
				items,
				global_stock_delta: 0,
				created_at: new Date().toISOString(),
			};
			store.movements = [...store.movements, movement];

			return delay({ data: structuredClone(movement) });
		},
	);

/**
 * `POST B/inventory-adjustments` (card 08, sección 11): corrige una diferencia
 * de conteo con motivo auditado.
 *
 * Decisiones no especificadas literalmente en el contrato (sección 11):
 * - **`related_stock_receipt_id` inexistente en la sucursal**: 422. El mock
 *   sólo conoce recepciones a través de los `origins` que dejaron, así que la
 *   comprobación de existencia es «alguna procedencia de esta sucursal la
 *   nombra»; enlazar a una recepción que este store no puede ver produciría un
 *   ajuste imposible de auditar.
 * - **`origin_id` que no pertenece a la recepción enlazada**: 422. El contrato
 *   exige «origen de esa recepción», y un origen ajeno rompería la promesa de
 *   que la corrección enlazada no reescribe otra procedencia.
 * - **Antes/después por ítem** se calcula secuencialmente: dos líneas del
 *   mismo producto en distinta condición ven, la segunda, el efecto de la
 *   primera. Es la única lectura coherente de «antes y después» dentro de una
 *   misma operación.
 *
 * **Reservas:** el ajuste no las toca. Corrige el físico de una ubicación, y
 * el disponible de la sucursal se recalcula contra los holds vigentes
 * (`getInventoryStockAvailability`), que pueden quedar por encima de lo que
 * existe. Ese faltante se muestra, no se valida: rechazar el conteo obligaría
 * a mentir sobre lo que hay en la bodega, que es justo lo contrario de lo que
 * un ajuste por conteo hace.
 */
export const createInventoryAdjustment = (
	branchId: number,
	payload: IInventoryAdjustmentPayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IInventoryAdjustment }> =>
	withIdempotency(
		branchId,
		headers.idempotencyKey,
		{ action: 'inventory-adjustment', branchId, payload },
		async () => {
			// `warehouse_id` es obligatorio aunque admita `null`: la validación en
			// runtime cubre a los llamadores que no pasan por TypeScript.
			if (payload.warehouse_id === undefined) {
				return Promise.reject(
					apiError(
						422,
						'LOCATION_SELECTION_REQUIRED',
						PROCUREMENT_ERROR_DEFINITIONS.LOCATION_SELECTION_REQUIRED.fallbackMessage,
					),
				);
			}
			const invalidWarehouse = branchWarehouseError(branchId, payload.warehouse_id);
			if (invalidWarehouse) return Promise.reject(invalidWarehouse);

			if (!payload.reason?.trim()) {
				return Promise.reject(
					apiError(422, 'ADJUSTMENT_REASON_REQUIRED', 'Indica el motivo del ajuste.'),
				);
			}
			if (!payload.items?.length) {
				return Promise.reject(
					apiError(
						422,
						'ADJUSTMENT_ITEMS_REQUIRED',
						'Agrega al menos un producto al ajuste.',
					),
				);
			}

			const store = getStore(branchId);
			// Un opcional omitido y uno mandado en `null` son la misma cosa: sin
			// normalizar, `undefined !== null` convertía «sin recepción enlazada»
			// en «con recepción enlazada» y exigía origen a un egreso general.
			const receiptId = payload.related_stock_receipt_id ?? null;
			if (receiptId !== null) {
				const known = store.origins.some((origin) => origin.stock_receipt_id === receiptId);
				if (!known) {
					return Promise.reject(
						apiError(
							422,
							'ADJUSTMENT_RECEIPT_NOT_FOUND',
							'La recepción enlazada no tiene stock vigente en esta sucursal.',
						),
					);
				}
			}

			// El `reduce` conserva el primer error y no lo pisa con los siguientes:
			// la respuesta describe el motivo por el que la operación se detuvo,
			// no el último problema que quedó por revisar.
			const seenItems = new Set<string>();
			const itemError = payload.items.reduce<Error | null>((found, item) => {
				if (found) return found;
				if (!Number.isInteger(item.quantity_delta) || item.quantity_delta === 0)
					return apiError(
						422,
						'ADJUSTMENT_QUANTITY_DELTA_INVALID',
						'La diferencia debe ser un entero distinto de cero.',
					);
				if (!STOCK_CONDITIONS.includes(item.condition))
					return apiError(
						422,
						'ADJUSTMENT_CONDITION_REQUIRED',
						'Indica si las unidades son aptas o no aptas.',
					);
				const key = `${item.product_id}:${item.condition}`;
				if (seenItems.has(key))
					return apiError(
						422,
						'ADJUSTMENT_DUPLICATE_ITEM',
						'Hay dos líneas del mismo producto y condición: únelas en una.',
					);
				seenItems.add(key);

				const originId = item.origin_id ?? null;
				if (item.quantity_delta > 0 && originId !== null)
					return apiError(
						422,
						'ADJUSTMENT_ORIGIN_NOT_ALLOWED',
						'Un ingreso crea un origen de ajuste: no puede atribuirse a una procedencia anterior.',
					);
				if (item.quantity_delta < 0 && receiptId !== null && originId === null)
					return apiError(
						422,
						'ADJUSTMENT_ORIGIN_REQUIRED',
						'Con una recepción enlazada, el egreso debe indicar un origen de esa recepción.',
					);
				if (originId !== null) {
					const origin = originsAt(
						store.origins,
						item.product_id,
						payload.warehouse_id,
					).find((candidate) => candidate.origin_id === originId);
					if (!origin || (receiptId !== null && origin.stock_receipt_id !== receiptId))
						return apiError(
							422,
							'ADJUSTMENT_ORIGIN_MISMATCH',
							'El origen indicado no corresponde a este producto, ubicación o recepción.',
						);
				}
				return null;
			}, null);
			if (itemError) return Promise.reject(itemError);

			// Saldo suficiente para cada egreso, evaluado en cascada: dos líneas del
			// mismo producto no pueden gastar dos veces el mismo saldo.
			const projected = new Map<string, number>();
			const balanceError = payload.items
				.filter((item) => item.quantity_delta < 0)
				.reduce<Error | null>((found, item) => {
					if (found) return found;
					const originId = item.origin_id ?? null;
					const key = `${item.product_id}:${item.condition}:${originId ?? 'fifo'}`;
					const available =
						projected.get(key) ??
						conditionBalanceAt(
							store.origins,
							item.product_id,
							payload.warehouse_id,
							item.condition,
							originId,
						);
					const requested = Math.abs(item.quantity_delta);
					if (requested > available)
						return apiError(
							409,
							'INSUFFICIENT_LOCATION_STOCK',
							PROCUREMENT_ERROR_DEFINITIONS.INSUFFICIENT_LOCATION_STOCK
								.fallbackMessage,
						);
					projected.set(key, available - requested);
					return null;
				}, null);
			if (balanceError) return Promise.reject(balanceError);

			let working: IInventorySeedOrigin[] = store.origins;
			const items: IInventoryAdjustmentItem[] = payload.items.map((item) => {
				const before = locationTotalsAt(working, item.product_id, payload.warehouse_id);
				if (item.quantity_delta < 0) {
					working = takeFromLocation(
						working,
						item.product_id,
						payload.warehouse_id,
						item.condition,
						Math.abs(item.quantity_delta),
						item.origin_id ?? null,
					).origins;
				} else {
					// Ingreso positivo: origen desconocido de ajuste, al final de la
					// cola FIFO para no adelantarse a stock más viejo.
					const lastFifo = working.reduce(
						(highest, origin) => Math.max(highest, origin.fifo_at),
						0,
					);
					working = [
						...working,
						{
							origin_id: nextOriginIdFor(branchId),
							origin_type: 'inventory_adjustment',
							stock_receipt_id: null,
							received_on: null,
							supplier: null,
							purchase_document: null,
							physical_quantity: item.quantity_delta,
							fit_quantity: item.condition === 'fit' ? item.quantity_delta : 0,
							unfit_quantity: item.condition === 'unfit' ? item.quantity_delta : 0,
							branch_id: branchId,
							product_id: item.product_id,
							warehouse_id: payload.warehouse_id,
							fifo_at: lastFifo + 1,
						},
					];
				}
				const after = locationTotalsAt(working, item.product_id, payload.warehouse_id);
				return {
					product_id: item.product_id,
					quantity_delta: item.quantity_delta,
					condition: item.condition,
					physical_quantity_before: before.physical,
					physical_quantity_after: after.physical,
					fit_quantity_before: before.fit,
					fit_quantity_after: after.fit,
					unfit_quantity_before: before.unfit,
					unfit_quantity_after: after.unfit,
				};
			});
			store.origins = working;

			const adjustment: IInventoryAdjustment = {
				id: crypto.randomUUID(),
				operation_type: 'inventory_adjustment',
				branch_id: branchId,
				warehouse_id: payload.warehouse_id,
				reason: payload.reason.trim(),
				notes: payload.notes?.trim() || null,
				related_stock_receipt_id: receiptId,
				items,
				created_at: new Date().toISOString(),
			};
			store.adjustments = [...store.adjustments, adjustment];

			return delay({ data: structuredClone(adjustment) });
		},
	);

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
