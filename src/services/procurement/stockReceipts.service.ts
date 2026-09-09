import {
	bodegaActor,
	getProcurementWarehousesForBranchContext,
	procurementWarehouses,
	PROCUREMENT_WAREHOUSE_BRANCH_BY_ID,
	purchasableProcurementProducts,
	STOCK_RECEIPT_CONSUMED_IDS,
	stockReceipts as stockReceiptSeed,
} from '@/mocks/db/procurement.db';
import {
	applyStockReceiptCoverageDelta,
	bumpPurchaseDocumentStockReceiptsCount,
	findPurchaseDocumentForReceipts,
} from '@/services/procurement/purchaseDocuments.service';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
import {
	clearAllPersistedMockState,
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';
import {
	PROCUREMENT_ERROR_DEFINITIONS,
	RECEIPT_DOCUMENT_SUPPLIER_MISMATCH_MESSAGE,
} from '@/utils/procurementErrors.util';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import { previewCostBreakdown } from '@/utils/procurementCost.util';
import { normalizePageParams } from '@/utils/procurementPagination.util';
import type {
	IApiCollectionEnvelope,
	IProcurementActorCompact,
	IProcurementCost,
	ISupplierCompact,
	IStockReceipt,
	IStockReceiptCancelPayload,
	IStockReceiptCreatePayload,
	IStockReceiptItem,
	IStockReceiptLineManualInput,
	IStockReceiptLineWithDocumentInput,
	IStockReceiptLinkPurchaseDocumentPayload,
	IStockReceiptListParams,
	IStockReceiptListRow,
	IStockReceiptReversePayload,
	IStockReceiptUpdatePayload,
	IWarehouseCompact,
	TCostEntryBasis,
	TProcurementAllowedAction,
	TStockReceiptStatus,
} from '@/interface/procurement.interface';

/**
 * Servicio mock de recepciones físicas — sección 7 del contrato de
 * abastecimiento (`frontend-guide.md`, PR #67 del backend, rama
 * `docs/procurement-stock-receipts`).
 *
 * **Ninguno de estos endpoints existe todavía.** Simula
 * `/api/subsidiaries/{subsidiary}/procurement/stock-receipts` contra un store
 * en memoria particionado por filial, con `ETag`/`If-Match` (sólo en `PATCH`,
 * igual que documentos) e `Idempotency-Key` en toda escritura, más la pieza
 * que hace valiosa a esta card: `post`/`retry` responden con la recepción en
 * `queued` y un **worker simulado** (`setTimeout`) la resuelve a `posted` o
 * `failed` después, igual que un job real. La UI hace polling sobre el `GET`
 * individual — el servicio no le miente sobre cuándo hay stock.
 *
 * Cuando una recepción se publica con documento vinculado, este servicio
 * llama a los helpers exportados de `purchaseDocuments.service` para reflejar
 * la cobertura en la línea del documento — la misma disciplina de «una sola
 * cola por documento, no dos» que ya resolvió `purchaseDocumentAttachments.service`
 * para adjuntos (ZF-109): acá no hace falta cola porque la mutación de
 * cobertura es síncrona (ver `applyStockReceiptCoverageDelta`).
 */

const MOCK_LATENCY_MS = 220;

/**
 * Demora del worker simulado entre `queued` y `posted`/`failed`. Mayor que
 * `MOCK_LATENCY_MS` a propósito: la UI tiene que mostrar «procesando» un
 * tiempo perceptible, no un parpadeo que nadie alcanza a ver ni a probar.
 */
export const STOCK_RECEIPT_WORKER_DELAY_MS = 900;

interface IStockReceiptVersionedStore {
	receipts: IStockReceipt[];
	versions: Map<number, number>;
}

const cloneReceipt = (receipt: IStockReceipt): IStockReceipt => ({
	...receipt,
	warehouse: { ...receipt.warehouse },
	supplier: receipt.supplier ? { ...receipt.supplier } : null,
	purchase_document: receipt.purchase_document ? { ...receipt.purchase_document } : null,
	posted_by: receipt.posted_by ? { ...receipt.posted_by } : null,
	processing: { ...receipt.processing },
	items: receipt.items.map((item) => ({ ...item, cost: { ...item.cost } })),
});

const storesBySubsidiary = new Map<number, IStockReceiptVersionedStore>();
const nextReceiptIdBySubsidiary = new Map<number, number>();
const nextItemIdBySubsidiary = new Map<number, number>();

/**
 * Persistencia local del store autoritativo (hallazgo 1, revisión ZF-110):
 * ver `procurementMockPersistence.util`. Se sube la versión si cambia la
 * forma de `IPersistedStockReceiptsState`.
 */
const STOCK_RECEIPTS_STORAGE_NAMESPACE = 'stock-receipts';
const STOCK_RECEIPTS_STORAGE_VERSION = 1;

interface IPersistedStockReceiptsState {
	receipts: IStockReceipt[];
	versions: [number, number][];
	nextReceiptId: number;
	nextItemId: number;
	/** Solicitante de un `post`/`retry` en curso, por ID de recepción — `posted_by` no es un worker anónimo (sección 7). */
	requestedBy: [number, IProcurementActorCompact][];
	/** Resultado idempotente por clave, para que un reintento tras recargar la pestaña siga viendo el mismo resultado. */
	idempotency: [string, IIdempotencyLogEntry][];
}

/** Filiales cuyo store ya reconcilió sus `queued` pendientes en este proceso. */
const reconciledSubsidiaries = new Set<number>();

const seedNextReceiptId = (): number =>
	Math.max(...stockReceiptSeed.map((receipt) => receipt.id)) + 1;
const seedNextItemId = (): number =>
	Math.max(...stockReceiptSeed.flatMap((receipt) => receipt.items.map((item) => item.id))) + 1;

const nextReceiptIdFor = (subsidiaryId: number): number => {
	const current = nextReceiptIdBySubsidiary.get(subsidiaryId) ?? seedNextReceiptId();
	nextReceiptIdBySubsidiary.set(subsidiaryId, current + 1);
	return current;
};

const nextItemIdFor = (subsidiaryId: number): number => {
	const current = nextItemIdBySubsidiary.get(subsidiaryId) ?? seedNextItemId();
	nextItemIdBySubsidiary.set(subsidiaryId, current + 1);
	return current;
};

/** `ETag` opaco: no es información que el cliente deba interpretar. */
const buildEtag = (receiptId: number, version: number): string => `W/"sr-${receiptId}-v${version}"`;

const bumpVersion = (store: IStockReceiptVersionedStore, receiptId: number): number => {
	const next = (store.versions.get(receiptId) ?? 0) + 1;
	store.versions.set(receiptId, next);
	return next;
};

const storeKey = (subsidiaryId: number, receiptId: number): string =>
	`${subsidiaryId}:${receiptId}`;

/**
 * Actor que pidió `post`/`retry`, capturado en la llamada y consumido recién
 * cuando el worker resuelve a `posted` — `posted_by` no representa a un
 * worker anónimo (sección 7): es quien solicitó contabilizar, no el proceso
 * asíncrono que lo ejecutó.
 */
const requestedByByReceipt = new Map<string, IProcurementActorCompact>();

type TStockReceiptWorkerOutcome = 'posted' | 'failed';

/**
 * Resultado forzado del worker para una recepción, sólo para pruebas. El
 * contrato no especifica una probabilidad de fallo real — es un detalle de
 * infraestructura del backend, no una regla de negocio — así que el mock no
 * la inventa: por defecto el worker siempre publica, y las pruebas que
 * necesitan ejercer `draft → queued → failed` fijan el resultado acá en vez
 * de depender de aleatoriedad no determinista.
 */
const forcedOutcomeByReceipt = new Map<string, TStockReceiptWorkerOutcome>();

export const setStockReceiptForcedOutcomeForTests = (
	subsidiaryId: number,
	receiptId: number,
	outcome: TStockReceiptWorkerOutcome | null,
): void => {
	const key = storeKey(subsidiaryId, receiptId);
	if (outcome === null) forcedOutcomeByReceipt.delete(key);
	else forcedOutcomeByReceipt.set(key, outcome);
};

const pendingWorkerTimers = new Map<string, ReturnType<typeof setTimeout>>();

const apiError = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true as const,
	response: { status, data },
});

const fail = (status: number, data: Record<string, unknown>): Promise<never> =>
	Promise.reject(apiError(status, data));

const buildFieldError = (
	code: string,
	message: string,
	field: string,
): Record<string, unknown> => ({
	message,
	code,
	errors: { [field]: [message] },
});

const delay = <T>(value: T): Promise<T> =>
	new Promise((resolve) => {
		setTimeout(() => resolve(value), MOCK_LATENCY_MS);
	});

interface IIdempotencyLogEntry {
	payloadHash: string;
	/** `undefined` mientras la operación sigue en curso. */
	result?: unknown;
}

const idempotencyLog = new Map<string, IIdempotencyLogEntry>();
const idempotencyLogKey = (subsidiaryId: number, key: string): string => `${subsidiaryId}:${key}`;

/** Serializa y guarda el estado autoritativo vigente de una filial (hallazgo 1). */
const persistSubsidiaryState = (subsidiaryId: number): void => {
	const store = storesBySubsidiary.get(subsidiaryId);
	if (!store) return;

	const prefix = `${subsidiaryId}:`;
	const requestedBy: [number, IProcurementActorCompact][] = [];
	requestedByByReceipt.forEach((actor, key) => {
		if (!key.startsWith(prefix)) return;
		requestedBy.push([Number(key.slice(prefix.length)), actor]);
	});
	const idempotency: [string, IIdempotencyLogEntry][] = [];
	idempotencyLog.forEach((entry, key) => {
		if (key.startsWith(prefix)) idempotency.push([key.slice(prefix.length), entry]);
	});

	const payload: IPersistedStockReceiptsState = {
		receipts: store.receipts,
		versions: Array.from(store.versions.entries()),
		nextReceiptId: nextReceiptIdBySubsidiary.get(subsidiaryId) ?? seedNextReceiptId(),
		nextItemId: nextItemIdBySubsidiary.get(subsidiaryId) ?? seedNextItemId(),
		requestedBy,
		idempotency,
	};
	savePersistedMockState(
		STOCK_RECEIPTS_STORAGE_NAMESPACE,
		STOCK_RECEIPTS_STORAGE_VERSION,
		subsidiaryId,
		payload,
	);
};

/**
 * Misma disciplina que `withIdempotency` de `purchaseDocuments.service`: la
 * clave se reserva antes del primer `await` para que dos llamadas
 * concurrentes con la misma clave no ejecuten `run()` en paralelo.
 */
async function withIdempotency<T>(
	subsidiaryId: number,
	idempotencyKey: string | undefined,
	payloadForHash: unknown,
	run: () => Promise<T>,
): Promise<T> {
	if (!idempotencyKey) {
		const result = await run();
		// Sin clave no hay entrada de idempotencia que persistir, pero el store
		// sí cambió: persiste igual (hallazgo 1).
		persistSubsidiaryState(subsidiaryId);
		return result;
	}

	const logKey = idempotencyLogKey(subsidiaryId, idempotencyKey);
	const payloadHash = JSON.stringify(payloadForHash);
	const logged = idempotencyLog.get(logKey);
	if (logged) {
		if (logged.payloadHash !== payloadHash) {
			return fail(409, {
				message: PROCUREMENT_ERROR_DEFINITIONS.IDEMPOTENCY_KEY_REUSED.fallbackMessage,
				code: 'IDEMPOTENCY_KEY_REUSED',
			});
		}
		if (!('result' in logged)) {
			return fail(409, {
				message: PROCUREMENT_ERROR_DEFINITIONS.OPERATION_IN_PROGRESS.fallbackMessage,
				code: 'OPERATION_IN_PROGRESS',
			});
		}
		return logged.result as T;
	}

	idempotencyLog.set(logKey, { payloadHash });
	try {
		const result = await run();
		idempotencyLog.set(logKey, { payloadHash, result });
		// Persiste **después** de fijar el resultado idempotente definitivo: si
		// se persistiera antes, una recarga justo en este instante congelaría la
		// clave en «en curso» para siempre (hallazgo 1: «conserva... resultado
		// idempotente»).
		persistSubsidiaryState(subsidiaryId);
		return result;
	} catch (error) {
		idempotencyLog.delete(logKey);
		throw error;
	}
}

/**
 * Serializa las escrituras sobre una misma recepción, igual que
 * `withDocumentLock` en documentos: el `ETag` protege contra pisar una
 * edición ajena, pero la validación (estado, `If-Match`, esperas a
 * `getProcurementSupplier`/`findPurchaseDocumentForReceipts`) y la escritura
 * final no son un único paso atómico.
 */
const receiptLocks = new Map<string, Promise<unknown>>();

function withReceiptLock<T>(
	subsidiaryId: number,
	receiptId: number,
	run: () => Promise<T>,
): Promise<T> {
	const lockKey = storeKey(subsidiaryId, receiptId);
	const previous = receiptLocks.get(lockKey) ?? Promise.resolve();
	const next = previous.then(run, run);
	receiptLocks.set(
		lockKey,
		next.catch(() => undefined),
	);
	return next;
}

/**
 * `allowed_actions` por estado (sección 7 y `allowedActionsByState` del
 * fixture). `posted` es la única entrada que **no** es una tabla estática:
 * `link_purchase_document` (card 07, sección 8) sólo corresponde ofrecerlo
 * mientras la recepción `posted` **no** tenga ya un documento vinculado — el
 * vínculo es único y no sustituible, así que una vez hecho no se vuelve a
 * ofrecer. `computeAllowedActionsForStatus` es la única función que decide
 * `posted`; todo punto del archivo que transiciona a `posted` (el worker) o
 * que cambia `purchase_document` en `posted` (`linkStockReceiptPurchaseDocument`)
 * pasa por ella en vez de leer la tabla estática directamente.
 */
const ALLOWED_ACTIONS_BY_STATUS: Record<
	Exclude<TStockReceiptStatus, 'posted'>,
	TProcurementAllowedAction[]
> = {
	draft: ['update', 'post', 'cancel'],
	queued: [],
	failed: ['update', 'retry', 'cancel'],
	cancelled: [],
	reversed: [],
};

/** Ver el comentario de `ALLOWED_ACTIONS_BY_STATUS`. */
const computeAllowedActionsForStatus = (
	status: TStockReceiptStatus,
	hasPurchaseDocument: boolean,
): TProcurementAllowedAction[] => {
	if (status === 'posted') {
		return hasPurchaseDocument ? ['reverse'] : ['reverse', 'link_purchase_document'];
	}
	return ALLOWED_ACTIONS_BY_STATUS[status];
};

/** Agrupa cantidades por línea de documento, por si dos ítems comparten línea. */
const groupQuantityByLine = (
	items: IStockReceiptItem[],
): { lineId: number; quantityDelta: number }[] => {
	const totals = new Map<number, number>();
	items.forEach((item) => {
		if (item.purchase_document_line_id === null) return;
		totals.set(
			item.purchase_document_line_id,
			(totals.get(item.purchase_document_line_id) ?? 0) + item.quantity,
		);
	});
	return Array.from(totals.entries()).map(([lineId, quantityDelta]) => ({
		lineId,
		quantityDelta,
	}));
};

/**
 * Agrupa cantidades de líneas «con documento» por `purchase_document_line_id`
 * (hallazgo 2): valida la suma, no cada ítem por separado.
 */
const groupDocumentLineQuantities = (
	items: (
		| IStockReceiptLineWithDocumentInput
		| { purchase_document_line_id: number; quantity: number }
	)[],
): Map<number, number> => {
	const grouped = new Map<number, number>();
	items.forEach((input) => {
		grouped.set(
			input.purchase_document_line_id,
			(grouped.get(input.purchase_document_line_id) ?? 0) + input.quantity,
		);
	});
	return grouped;
};

/**
 * Valida la capacidad **agregada y vigente** de cada línea de documento
 * involucrada (hallazgo 2, sección 7 del contrato): agrupa antes de
 * comparar contra `remaining_quantity`, y siempre contra el documento que se
 * le pase — al crear/editar es el snapshot recién leído; al contabilizar
 * (`resolveStockReceiptWorker`) es el documento **vigente** en ese instante,
 * no el leído cuando se creó el borrador. Devuelve el error del contrato
 * (`DOCUMENT_LINE_MISMATCH`/`RECEIPT_EXCEEDS_DOCUMENT`) o `null` si cabe.
 */
const validateDocumentLineCapacity = (
	document: NonNullable<ReturnType<typeof findPurchaseDocumentForReceipts>>,
	groupedQuantities: Map<number, number>,
): Record<string, unknown> | null => {
	const missingLine = Array.from(groupedQuantities.keys()).find(
		(lineId) => !document.items.some((item) => item.id === lineId),
	);
	if (missingLine !== undefined) {
		return {
			message: PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
			code: 'DOCUMENT_LINE_MISMATCH',
		};
	}

	const exceeding = Array.from(groupedQuantities.entries())
		.map(([lineId, quantity]) => ({
			quantity,
			line: document.items.find((item) => item.id === lineId)!,
		}))
		.find(({ quantity, line }) => quantity > line.remaining_quantity);
	if (exceeding) {
		return {
			message: PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_EXCEEDS_DOCUMENT.fallbackMessage,
			code: 'RECEIPT_EXCEEDS_DOCUMENT',
			context: {
				purchase_document_line_id: exceeding.line.id,
				remaining_quantity: exceeding.line.remaining_quantity,
			},
		};
	}

	return null;
};

const clearWorkerTimer = (subsidiaryId: number, receiptId: number): void => {
	const key = storeKey(subsidiaryId, receiptId);
	const timer = pendingWorkerTimers.get(key);
	if (timer) clearTimeout(timer);
	pendingWorkerTimers.delete(key);
};

/**
 * Resuelve el worker de una recepción `queued`: la publica o la falla. Corre
 * en su propio tick (`setTimeout`), no dentro de la escritura HTTP que
 * encoló — el 202 ya volvió con `queued` antes de que esto se ejecute.
 */
function resolveStockReceiptWorker(subsidiaryId: number, receiptId: number): void {
	const key = storeKey(subsidiaryId, receiptId);
	pendingWorkerTimers.delete(key);

	const store = storesBySubsidiary.get(subsidiaryId);
	const receipt = store?.receipts.find((item) => item.id === receiptId);
	// El store pudo resetearse (pruebas) o la recepción ya no estar `queued`
	// (no debería pasar: nada más transiciona una `queued`, pero es una
	// defensa barata contra un timer que sobrevivió a un reset).
	if (!store || !receipt || receipt.status !== 'queued') return;

	const outcome = forcedOutcomeByReceipt.get(key) ?? 'posted';
	const now = new Date().toISOString();
	const attemptCount = receipt.processing.attempt_count;

	// Antes de aplicar el efecto físico, revalida la capacidad **vigente** del
	// documento (hallazgo 2): dos recepciones (o dos reintentos) que
	// individualmente cabían al crearse pueden competir por el mismo saldo —
	// un borrador nunca reserva stock (sección 7), así que el único momento
	// seguro para bloquear el exceso es este, justo antes de contabilizar.
	if (outcome === 'posted' && receipt.purchase_document) {
		const liveDocument = findPurchaseDocumentForReceipts(
			subsidiaryId,
			receipt.purchase_document.id,
		);
		const groupedQuantities = new Map(
			groupQuantityByLine(receipt.items).map(({ lineId, quantityDelta }) => [
				lineId,
				quantityDelta,
			]),
		);
		const capacityError = liveDocument
			? validateDocumentLineCapacity(liveDocument, groupedQuantities)
			: {
					message: 'El documento de compra ya no existe.',
					code: 'DOCUMENT_LINE_MISMATCH',
				};

		if (capacityError) {
			const updated: IStockReceipt = {
				...receipt,
				status: 'failed',
				failed_at: now,
				allowed_actions: ALLOWED_ACTIONS_BY_STATUS.failed,
				failure_code: String(capacityError.code),
				failure_message: String(capacityError.message),
				processing: {
					attempt_count: attemptCount,
					last_attempt_at: now,
					next_retry_at: null,
				},
				updated_at: now,
			};
			store.receipts = store.receipts.map((item) => (item.id === receiptId ? updated : item));
			bumpVersion(store, receiptId);
			persistSubsidiaryState(subsidiaryId);
			return;
		}
	}

	if (outcome === 'posted') {
		if (receipt.purchase_document) {
			applyStockReceiptCoverageDelta(
				subsidiaryId,
				receipt.purchase_document.id,
				receipt.branch_id,
				receipt.warehouse,
				groupQuantityByLine(receipt.items),
			);
		}

		const requestedBy = requestedByByReceipt.get(key) ?? null;
		requestedByByReceipt.delete(key);

		const updated: IStockReceipt = {
			...receipt,
			status: 'posted',
			posted_at: now,
			allowed_actions: computeAllowedActionsForStatus(
				'posted',
				Boolean(receipt.purchase_document),
			),
			inventory_operation_id: crypto.randomUUID(),
			posted_by: requestedBy,
			processing: { ...receipt.processing, last_attempt_at: now, next_retry_at: null },
			updated_at: now,
		};
		store.receipts = store.receipts.map((item) => (item.id === receiptId ? updated : item));
	} else {
		const updated: IStockReceipt = {
			...receipt,
			status: 'failed',
			failed_at: now,
			allowed_actions: ALLOWED_ACTIONS_BY_STATUS.failed,
			failure_code: 'MOCK_STOCK_RECEIPT_WORKER_ERROR',
			failure_message:
				'No pudimos completar el ingreso de stock. Corrige los datos e inténtalo de nuevo.',
			processing: { attempt_count: attemptCount, last_attempt_at: now, next_retry_at: null },
			updated_at: now,
		};
		store.receipts = store.receipts.map((item) => (item.id === receiptId ? updated : item));
	}
	bumpVersion(store, receiptId);
	persistSubsidiaryState(subsidiaryId);
}

function scheduleWorker(subsidiaryId: number, receiptId: number): void {
	clearWorkerTimer(subsidiaryId, receiptId);
	const timer = setTimeout(
		() => resolveStockReceiptWorker(subsidiaryId, receiptId),
		STOCK_RECEIPT_WORKER_DELAY_MS,
	);
	pendingWorkerTimers.set(storeKey(subsidiaryId, receiptId), timer);
}

const seedStore = (subsidiaryId: number): IStockReceiptVersionedStore => {
	const store: IStockReceiptVersionedStore = {
		receipts: stockReceiptSeed.map(cloneReceipt),
		versions: new Map(stockReceiptSeed.map((receipt) => [receipt.id, 1])),
	};
	// La recepción sembrada en `queued` necesita un solicitante histórico
	// coherente: `posted_by` no representa a un worker anónimo (sección 7), y
	// sin esto el fixture resolvía a `posted_by: null` porque nunca pasó por
	// `postStockReceipt`, que es lo único que normalmente registra al actor.
	store.receipts
		.filter((receipt) => receipt.status === 'queued')
		.forEach((receipt) => {
			const key = storeKey(subsidiaryId, receipt.id);
			if (!requestedByByReceipt.has(key)) requestedByByReceipt.set(key, bodegaActor);
		});
	return store;
};

/**
 * Reconstruye el store de una filial desde `localStorage`, si existe
 * (hallazgo 1). Repuebla también los mapas satélite (`requestedBy`,
 * `idempotencyLog`, contadores de ID) que no viven dentro del store mismo.
 */
const hydrateStoreFromStorage = (subsidiaryId: number): IStockReceiptVersionedStore | null => {
	const persisted = loadPersistedMockState<IPersistedStockReceiptsState>(
		STOCK_RECEIPTS_STORAGE_NAMESPACE,
		STOCK_RECEIPTS_STORAGE_VERSION,
		subsidiaryId,
	);
	if (!persisted) return null;

	nextReceiptIdBySubsidiary.set(subsidiaryId, persisted.nextReceiptId);
	nextItemIdBySubsidiary.set(subsidiaryId, persisted.nextItemId);
	persisted.requestedBy.forEach(([receiptId, actor]) => {
		requestedByByReceipt.set(storeKey(subsidiaryId, receiptId), actor);
	});
	persisted.idempotency.forEach(([key, entry]) => {
		idempotencyLog.set(idempotencyLogKey(subsidiaryId, key), entry);
	});

	return { receipts: persisted.receipts, versions: new Map(persisted.versions) };
};

/**
 * Reanuda el trabajo pendiente de las recepciones `queued` que sobrevivieron
 * a hidratar el store de una filial (hallazgo 1): su `setTimeout` no
 * sobrevive a una recarga real (reinstancia el módulo), así que sin esto se
 * quedarían en `queued` para siempre. Corre una sola vez por filial, tanto
 * si el store viene de `localStorage` como si nace de la semilla de
 * fixtures — un `queued` es un `queued`, sin importar su origen.
 */
const reconcileQueuedReceipts = (
	subsidiaryId: number,
	store: IStockReceiptVersionedStore,
): void => {
	store.receipts
		.filter((receipt) => receipt.status === 'queued')
		.forEach((receipt) => scheduleWorker(subsidiaryId, receipt.id));
};

const getStore = (subsidiaryId: number): IStockReceiptVersionedStore => {
	let store = storesBySubsidiary.get(subsidiaryId);
	if (store === undefined) {
		store = hydrateStoreFromStorage(subsidiaryId) ?? seedStore(subsidiaryId);
		storesBySubsidiary.set(subsidiaryId, store);
	}
	if (!reconciledSubsidiaries.has(subsidiaryId)) {
		reconciledSubsidiaries.add(subsidiaryId);
		reconcileQueuedReceipts(subsidiaryId, store);
	}
	return store;
};

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

const searchMatchesReceipt = (receipt: IStockReceipt, search: string): boolean => {
	const needle = search.trim().toLocaleLowerCase('es-CL');
	if (!needle) return true;

	return [
		receipt.purchase_document?.document_number,
		receipt.supplier?.display_name,
		receipt.supplier?.rut,
	].some((value) => Boolean(value) && value!.toLocaleLowerCase('es-CL').includes(needle));
};

const toSupplierCompact = (supplier: {
	id: number;
	display_name: string;
	rut: string;
	is_active: boolean;
}): ISupplierCompact => ({
	id: supplier.id,
	display_name: supplier.display_name,
	rut: supplier.rut,
	is_active: supplier.is_active,
});

const findWarehouse = (warehouseId: number): IWarehouseCompact | undefined =>
	procurementWarehouses.find((warehouse) => warehouse.id === warehouseId);

interface IWarehouseContext {
	warehouse: IWarehouseCompact;
	branchId: number;
}

/**
 * Resuelve la bodega elegida a su sucursal real (hallazgo 5, sección 7 del
 * contrato: «Nueva recepción exige bodega; branch se deriva de ella»).
 * `null` si la bodega no existe o —cuando se conocen las sucursales
 * autorizadas del actor— pertenece a una sucursal fuera de esa lista. Lista
 * vacía/`undefined` de sucursales autorizadas no filtra por sucursal, mismo
 * criterio que `canAccessBranch` de `useAuthorization`.
 */
const resolveWarehouseContext = (
	warehouseId: number,
	authorizedBranchIds?: readonly number[] | null,
): IWarehouseContext | null => {
	const warehouse = findWarehouse(warehouseId);
	if (!warehouse) return null;

	const branchId = PROCUREMENT_WAREHOUSE_BRANCH_BY_ID[warehouseId];
	if (branchId === undefined) return null;

	const hasBranchRestriction = Boolean(authorizedBranchIds && authorizedBranchIds.length > 0);
	if (hasBranchRestriction && !authorizedBranchIds!.includes(branchId)) return null;

	return { warehouse, branchId };
};

/**
 * Bodegas que corresponde ofrecer para dar de alta/editar una recepción
 * (hallazgo 5): filtra, si se conocen, por sucursales autorizadas. Se expone
 * desde el servicio para que la UI no importe el catálogo de fixtures
 * directamente para decidir qué mostrar en un selector — la misma disciplina
 * que ya siguen `listPurchaseDocuments`/`listProcurementSuppliers` para sus
 * propios pickers.
 */
export const listWarehousesForStockReceipts = (
	authorizedBranchIds?: readonly number[] | null,
): IWarehouseCompact[] => getProcurementWarehousesForBranchContext(authorizedBranchIds);

const todayBusinessDate = (): string => new Date().toISOString().slice(0, 10);

/**
 * Costo declarado sin documento (sección 2: «sin documento: base declarada
 * provisional»). A diferencia del costo de un documento, la base efectiva
 * **no** cambia por tipo documental — se conserva tal como se declaró.
 */
const buildDeclaredCost = (amount: string, basis: TCostEntryBasis): IProcurementCost | null => {
	const breakdown = previewCostBreakdown(amount, basis);
	if (!breakdown) return null;
	const enteredCents = parseDecimalString(amount);
	if (enteredCents === null) return null;

	return {
		currency_code: 'CLP',
		entered_unit_amount: formatDecimalCents(enteredCents),
		entered_basis: basis,
		vat_rate_percent: breakdown.vat_rate_percent,
		net_unit_amount: breakdown.net_unit_amount,
		vat_unit_amount: breakdown.vat_unit_amount,
		gross_unit_amount: breakdown.gross_unit_amount,
		effective_unit_amount:
			basis === 'net' ? breakdown.net_unit_amount : breakdown.gross_unit_amount,
		effective_basis: basis,
		source: 'declared',
		calculation: 'single_price',
	};
};

/** Costo desconocido (sección 2): importes y tasa `null`, bases `unknown`. */
const UNKNOWN_DECLARED_COST: IProcurementCost = {
	currency_code: 'CLP',
	entered_unit_amount: null,
	entered_basis: 'unknown',
	vat_rate_percent: null,
	net_unit_amount: null,
	vat_unit_amount: null,
	gross_unit_amount: null,
	effective_unit_amount: null,
	effective_basis: 'unknown',
	source: 'unknown',
	calculation: 'unknown',
};

interface IBuildItemResult {
	item?: IStockReceiptItem;
	error?: Record<string, unknown>;
}

/**
 * Línea del alta/edición **con documento**: producto, proveedor y costo se
 * derivan del documento confirmado; la UI no ofrece sobrescribirlos
 * (sección 7). `remaining_quantity` es el de la línea **vigente** del
 * documento, no la sembrada al abrir el formulario — dos recepciones
 * concurrentes contra el mismo documento no pueden exceder su capacidad real.
 */
const buildDocumentLine = (
	subsidiaryId: number,
	document: NonNullable<ReturnType<typeof findPurchaseDocumentForReceipts>>,
	input: IStockReceiptLineWithDocumentInput,
	existingId?: number,
): IBuildItemResult => {
	const line = document.items.find((item) => item.id === input.purchase_document_line_id);
	if (!line) {
		return {
			error: {
				message: PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
				code: 'DOCUMENT_LINE_MISMATCH',
			},
		};
	}
	if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
		return {
			error: buildFieldError(
				'STOCK_RECEIPT_QUANTITY_INVALID',
				'La cantidad debe ser un entero positivo.',
				'quantity',
			),
		};
	}
	// La comparación contra `remaining_quantity` **no** se hace acá por línea
	// individual (hallazgo 2): dos ítems de esta misma recepción pueden
	// compartir `purchase_document_line_id` y cada uno, visto por separado,
	// caber en el saldo — `validateDocumentLineCapacity` valida la suma
	// agrupada antes de aplicar el efecto físico.

	return {
		item: {
			id: existingId ?? nextItemIdFor(subsidiaryId),
			product: line.product,
			sku_snapshot: line.sku_snapshot,
			name_snapshot: line.name_snapshot,
			purchase_document_line_id: line.id,
			quantity: input.quantity,
			cost: line.cost,
		},
	};
};

/** Línea del alta/edición **sin documento**. */
const buildManualLine = (
	subsidiaryId: number,
	input: IStockReceiptLineManualInput,
	hasKnownSupplier: boolean,
	existingId?: number,
): IBuildItemResult => {
	const product = purchasableProcurementProducts.find((item) => item.id === input.product_id);
	if (!product) {
		return {
			error: buildFieldError(
				'STOCK_RECEIPT_PRODUCT_INVALID',
				'El producto no es válido para una recepción (debe ser no serializado y de la filial).',
				'product_id',
			),
		};
	}
	if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
		return {
			error: buildFieldError(
				'STOCK_RECEIPT_QUANTITY_INVALID',
				'La cantidad debe ser un entero positivo.',
				'quantity',
			),
		};
	}

	const hasAmount = Boolean(input.unit_cost?.trim());
	const hasBasis = Boolean(input.unit_cost_basis);

	if (hasKnownSupplier && (!hasAmount || !hasBasis)) {
		return {
			error: buildFieldError(
				!hasAmount ? 'UNIT_COST_REQUIRED' : 'UNIT_COST_BASIS_REQUIRED',
				!hasAmount
					? PROCUREMENT_ERROR_DEFINITIONS.UNIT_COST_REQUIRED.fallbackMessage
					: PROCUREMENT_ERROR_DEFINITIONS.UNIT_COST_BASIS_REQUIRED.fallbackMessage,
				'unit_cost',
			),
		};
	}
	if (!hasKnownSupplier && hasAmount !== hasBasis) {
		return {
			error: buildFieldError(
				!hasAmount ? 'UNIT_COST_REQUIRED' : 'UNIT_COST_BASIS_REQUIRED',
				'El monto y la base del costo deben viajar juntos, o ambos ausentes.',
				'unit_cost',
			),
		};
	}

	let cost = UNKNOWN_DECLARED_COST;
	if (hasAmount && hasBasis) {
		const built = buildDeclaredCost(input.unit_cost!.trim(), input.unit_cost_basis!);
		if (!built) {
			return {
				error: buildFieldError(
					'UNIT_COST_REQUIRED',
					'El costo unitario no es válido.',
					'unit_cost',
				),
			};
		}
		cost = built;
	}

	return {
		item: {
			id: existingId ?? nextItemIdFor(subsidiaryId),
			product,
			sku_snapshot: product.sku,
			name_snapshot: product.name,
			purchase_document_line_id: null,
			quantity: input.quantity,
			cost,
		},
	};
};

interface IMockWriteHeaders {
	idempotencyKey?: string;
	etag?: string | null;
}

/** `GET /stock-receipts`. Orden `received_on` DESC, ID DESC (sección 7). */
export const listStockReceipts = (
	subsidiaryId: number,
	params: IStockReceiptListParams = {},
): Promise<IApiCollectionEnvelope<IStockReceiptListRow>> => {
	const store = getStore(subsidiaryId);
	let filtered = store.receipts;

	if (params.status) filtered = filtered.filter((receipt) => receipt.status === params.status);
	if (params.supplier_id !== undefined)
		filtered = filtered.filter((receipt) => receipt.supplier?.id === params.supplier_id);
	if (params.purchase_document_id !== undefined)
		filtered = filtered.filter(
			(receipt) => receipt.purchase_document?.id === params.purchase_document_id,
		);
	if (params.branch_id !== undefined)
		filtered = filtered.filter((receipt) => receipt.branch_id === params.branch_id);
	if (params.warehouse_id !== undefined)
		filtered = filtered.filter((receipt) => receipt.warehouse.id === params.warehouse_id);
	if (params.received_from)
		filtered = filtered.filter((receipt) => receipt.received_on >= params.received_from!);
	if (params.received_to)
		filtered = filtered.filter((receipt) => receipt.received_on <= params.received_to!);
	if (params.search)
		filtered = filtered.filter((receipt) => searchMatchesReceipt(receipt, params.search!));

	const sorted = [...filtered].sort(
		(left, right) => right.received_on.localeCompare(left.received_on) || right.id - left.id,
	);

	const { page, per_page: perPage } = normalizePageParams(params);
	const total = sorted.length;
	const lastPage = Math.max(1, Math.ceil(total / perPage));
	const currentPage = Math.min(page, lastPage);
	const start = (currentPage - 1) * perPage;
	const pageItems = sorted.slice(start, start + perPage);

	return delay({
		data: pageItems.map(toListRow),
		links: {
			first: '?page=1',
			last: `?page=${lastPage}`,
			prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
			next: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
		},
		meta: {
			current_page: currentPage,
			from: total === 0 ? null : start + 1,
			last_page: lastPage,
			links: [],
			path: `/api/subsidiaries/${subsidiaryId}/procurement/stock-receipts`,
			per_page: perPage,
			to: total === 0 ? null : Math.min(start + perPage, total),
			total,
		},
	});
};

/**
 * `GET .../purchase-documents/{document}/stock-receipts` (hallazgo 9, sección
 * 6 del contrato): resumen paginado de las recepciones vinculadas a un
 * documento, servido desde **este** store — el único que conoce recepciones
 * reales — para que `purchaseDocuments.service` no necesite importar este
 * módulo (evita el ciclo de inicialización que ya lo importa a él).
 */
export const listStockReceiptsForPurchaseDocument = (
	subsidiaryId: number,
	documentId: number,
	params: { page?: number; per_page?: number } = {},
): Promise<IApiCollectionEnvelope<IStockReceiptListRow>> =>
	listStockReceipts(subsidiaryId, { ...params, purchase_document_id: documentId });

/** `GET /stock-receipts/{receipt}`: detalle con `ETag`. */
export const getStockReceipt = (
	subsidiaryId: number,
	id: number,
): Promise<{ data: IStockReceipt; headers: { etag: string } }> => {
	const store = getStore(subsidiaryId);
	const receipt = store.receipts.find((item) => item.id === id);
	if (!receipt) {
		return fail(404, { message: 'La recepción no existe.', code: 'STOCK_RECEIPT_NOT_FOUND' });
	}

	const version = store.versions.get(id) ?? 1;
	return delay({ data: cloneReceipt(receipt), headers: { etag: buildEtag(id, version) } });
};

/** `POST /stock-receipts`: 201 `draft`, con o sin documento (sección 7). */
export const createStockReceipt = (
	subsidiaryId: number,
	payload: IStockReceiptCreatePayload,
	headers: IMockWriteHeaders = {},
	/**
	 * Sucursales que el actor puede operar (`useCurrentBranch().visibleBranches`,
	 * por ejemplo). `undefined`/vacío no restringe por sucursal — mismo criterio
	 * que `canAccessBranch` de `useAuthorization` (sección 5 de este archivo de
	 * revisión): sin lista, no bloquea. Siempre restringe por **filial**.
	 */
	authorizedBranchIds?: readonly number[] | null,
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'create', payload },
		async () => {
			const warehouseContext = resolveWarehouseContext(
				payload.warehouse_id,
				authorizedBranchIds,
			);
			if (!warehouseContext) {
				return fail(
					422,
					buildFieldError(
						'WAREHOUSE_REQUIRED',
						'Selecciona una bodega válida de tu filial y sucursales autorizadas.',
						'warehouse_id',
					),
				);
			}
			const { warehouse, branchId } = warehouseContext;
			if (!payload.received_on) {
				return fail(
					422,
					buildFieldError(
						'RECEIVED_ON_REQUIRED',
						'Indica la fecha de recepción.',
						'received_on',
					),
				);
			}
			if (payload.received_on > todayBusinessDate()) {
				return fail(
					422,
					buildFieldError(
						'RECEIVED_ON_NOT_FUTURE',
						'La fecha de recepción no puede ser futura.',
						'received_on',
					),
				);
			}
			if (!Array.isArray(payload.items) || payload.items.length === 0) {
				return fail(422, {
					message: 'La recepción necesita al menos una línea.',
					code: 'STOCK_RECEIPT_ITEMS_EMPTY',
				});
			}

			let supplierCompact: ISupplierCompact | null = null;
			let items: IStockReceiptItem[];

			if (payload.purchase_document_id !== null) {
				const document = findPurchaseDocumentForReceipts(
					subsidiaryId,
					payload.purchase_document_id,
				);
				if (!document) {
					return fail(
						422,
						buildFieldError(
							'PURCHASE_DOCUMENT_NOT_FOUND',
							'El documento de compra no existe.',
							'purchase_document_id',
						),
					);
				}
				if (document.status !== 'confirmed') {
					return fail(422, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_NOT_CONFIRMED.fallbackMessage,
						code: 'DOCUMENT_NOT_CONFIRMED',
					});
				}

				const results = payload.items.map((input) =>
					buildDocumentLine(subsidiaryId, document, input),
				);
				const failed = results.find((result) => result.error);
				if (failed) return fail(422, failed.error!);

				// Hallazgo 2: valida la suma agrupada por línea, no cada ítem por
				// separado — dos ítems de esta recepción que comparten línea pueden
				// caber individualmente y exceder el saldo juntos.
				const groupedQuantities = groupDocumentLineQuantities(payload.items);
				const capacityError = validateDocumentLineCapacity(document, groupedQuantities);
				if (capacityError) return fail(422, capacityError);

				items = results.map((result) => result.item!);
				supplierCompact = document.supplier;
			} else {
				if (!payload.reason?.trim()) {
					return fail(
						422,
						buildFieldError(
							'STOCK_RECEIPT_REASON_REQUIRED',
							'Indica el motivo del ingreso sin documento.',
							'reason',
						),
					);
				}
				if (payload.supplier_id !== null && payload.supplier_id !== undefined) {
					try {
						const { data: supplier } = await getProcurementSupplier(
							subsidiaryId,
							payload.supplier_id,
						);
						supplierCompact = toSupplierCompact(supplier);
					} catch {
						return fail(
							422,
							buildFieldError(
								'SUPPLIER_NOT_FOUND',
								'El proveedor no existe.',
								'supplier_id',
							),
						);
					}
				}

				const hasKnownSupplier = supplierCompact !== null;
				const results = payload.items.map((input) =>
					buildManualLine(subsidiaryId, input, hasKnownSupplier),
				);
				const failed = results.find((result) => result.error);
				if (failed) return fail(422, failed.error!);
				items = results.map((result) => result.item!);
			}

			const now = new Date().toISOString();
			const receipt: IStockReceipt = {
				id: nextReceiptIdFor(subsidiaryId),
				subsidiary_id: subsidiaryId,
				branch_id: branchId,
				status: 'draft',
				warehouse,
				supplier: supplierCompact,
				purchase_document:
					payload.purchase_document_id === null
						? null
						: (() => {
								const document = findPurchaseDocumentForReceipts(
									subsidiaryId,
									payload.purchase_document_id,
								)!;
								return {
									id: document.id,
									document_type: document.document_type,
									document_number: document.document_number,
									issue_date: document.issue_date,
								};
							})(),
				received_on: payload.received_on,
				items_count: items.length,
				total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
				created_at: now,
				posted_at: null,
				allowed_actions: ALLOWED_ACTIONS_BY_STATUS.draft,
				reason: payload.purchase_document_id === null ? payload.reason.trim() : null,
				notes: payload.notes?.trim() || null,
				items,
				inventory_operation_id: null,
				reversal_operation_id: null,
				queued_at: null,
				failed_at: null,
				reversed_at: null,
				cancellation_reason: null,
				reversal_reason: null,
				failure_code: null,
				failure_message: null,
				processing: { attempt_count: 0, last_attempt_at: null, next_retry_at: null },
				posted_by: null,
				updated_at: now,
			};

			const store = getStore(subsidiaryId);
			store.receipts = [...store.receipts, receipt];
			store.versions.set(receipt.id, 1);

			if (receipt.purchase_document) {
				bumpPurchaseDocumentStockReceiptsCount(
					subsidiaryId,
					receipt.purchase_document.id,
					1,
				);
			}

			return delay({
				data: cloneReceipt(receipt),
				headers: { etag: buildEtag(receipt.id, 1) },
			});
		},
	);

/**
 * `PATCH /stock-receipts/{receipt}`: `draft`, y también corrige `failed`
 * (vuelve a `draft`, limpia el error visible, conserva `processing`). Exige
 * `If-Match`. `items` presente reemplaza la colección completa, mismo patrón
 * de documentos.
 */
export const updateStockReceipt = (
	subsidiaryId: number,
	id: number,
	payload: IStockReceiptUpdatePayload,
	headers: IMockWriteHeaders = {},
	authorizedBranchIds?: readonly number[] | null,
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'update', id, payload }, () =>
		withReceiptLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.receipts.find((receipt) => receipt.id === id);
			if (!existing) {
				return fail(404, {
					message: 'La recepción no existe.',
					code: 'STOCK_RECEIPT_NOT_FOUND',
				});
			}
			if (!headers.etag) {
				return fail(428, {
					message: 'Falta la versión del registro. Recarga y vuelve a intentarlo.',
				});
			}
			const currentVersion = store.versions.get(id) ?? 1;
			if (headers.etag !== buildEtag(id, currentVersion)) {
				return fail(412, {
					message:
						PROCUREMENT_ERROR_DEFINITIONS.RESOURCE_VERSION_CONFLICT.fallbackMessage,
					code: 'RESOURCE_VERSION_CONFLICT',
				});
			}
			if (existing.status !== 'draft' && existing.status !== 'failed') {
				return fail(409, {
					message: 'La recepción ya no admite cambios en este estado.',
					code: 'STOCK_RECEIPT_NOT_EDITABLE',
				});
			}

			// Hallazgo 5: cambiar de bodega recalcula `branch_id` desde la bodega
			// elegida, nunca desde la sucursal activa de quien edita.
			let { warehouse } = existing;
			let branchId = existing.branch_id;
			if (payload.warehouse_id !== undefined) {
				const warehouseContext = resolveWarehouseContext(
					payload.warehouse_id,
					authorizedBranchIds,
				);
				if (!warehouseContext) {
					return fail(
						422,
						buildFieldError(
							'WAREHOUSE_REQUIRED',
							'Selecciona una bodega válida de tu filial y sucursales autorizadas.',
							'warehouse_id',
						),
					);
				}
				warehouse = warehouseContext.warehouse;
				branchId = warehouseContext.branchId;
			}

			// Hallazgo 6: `received_on` sólo se cambia en `draft` (sección 7). Una
			// recepción `failed` la conserva hasta volver a `draft` — corregir
			// otros campos sí se permite, y reenviar el mismo valor no cuenta como
			// «cambiarla».
			if (
				existing.status === 'failed' &&
				payload.received_on !== undefined &&
				payload.received_on !== existing.received_on
			) {
				return fail(
					422,
					buildFieldError(
						'STOCK_RECEIPT_RECEIVED_ON_IMMUTABLE',
						'La fecha de recepción no se puede cambiar mientras la recepción tiene un error. Corrige el resto y guarda para volver a borrador; ahí sí se puede cambiar la fecha.',
						'received_on',
					),
				);
			}
			const receivedOn = payload.received_on ?? existing.received_on;
			if (receivedOn > todayBusinessDate()) {
				return fail(
					422,
					buildFieldError(
						'RECEIVED_ON_NOT_FUTURE',
						'La fecha de recepción no puede ser futura.',
						'received_on',
					),
				);
			}

			const isManual = existing.purchase_document === null;
			let supplierCompact = existing.supplier;
			if (isManual && Object.prototype.hasOwnProperty.call(payload, 'supplier_id')) {
				const nextSupplierId = payload.supplier_id ?? null;
				if (nextSupplierId === null) {
					supplierCompact = null;
				} else {
					try {
						const { data: supplier } = await getProcurementSupplier(
							subsidiaryId,
							nextSupplierId,
						);
						supplierCompact = toSupplierCompact(supplier);
					} catch {
						return fail(
							422,
							buildFieldError(
								'SUPPLIER_NOT_FOUND',
								'El proveedor no existe.',
								'supplier_id',
							),
						);
					}
				}
			}

			let { items } = existing;
			if (payload.items !== undefined) {
				if (payload.items.length === 0) {
					return fail(422, {
						message: 'La recepción necesita al menos una línea.',
						code: 'STOCK_RECEIPT_ITEMS_EMPTY',
					});
				}
				const existingById = new Map(existing.items.map((item) => [item.id, item]));

				if (isManual) {
					const hasKnownSupplier = supplierCompact !== null;
					const results = (payload.items as IStockReceiptLineManualInput[]).map(
						(input) => {
							const existingId =
								input.id !== undefined ? existingById.get(input.id)?.id : undefined;
							if (input.id !== undefined && existingId === undefined) {
								return {
									error: {
										message:
											PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH
												.fallbackMessage,
										code: 'DOCUMENT_LINE_MISMATCH',
									},
								};
							}
							return buildManualLine(
								subsidiaryId,
								input,
								hasKnownSupplier,
								existingId,
							);
						},
					);
					const failed = results.find((result) => result.error);
					if (failed) return fail(422, failed.error!);
					items = results.map((result) => result.item!);
				} else {
					const document = findPurchaseDocumentForReceipts(
						subsidiaryId,
						existing.purchase_document!.id,
					)!;
					const documentItems = payload.items as IStockReceiptLineWithDocumentInput[];
					const results = documentItems.map((input) => {
						const existingId =
							input.id !== undefined ? existingById.get(input.id)?.id : undefined;
						if (input.id !== undefined && existingId === undefined) {
							return {
								error: {
									message:
										PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH
											.fallbackMessage,
									code: 'DOCUMENT_LINE_MISMATCH',
								},
							};
						}
						return buildDocumentLine(subsidiaryId, document, input, existingId);
					});
					const failed = results.find((result) => result.error);
					if (failed) return fail(422, failed.error!);

					// Hallazgo 2: suma agrupada por línea antes de comparar contra el
					// saldo vigente del documento.
					const groupedQuantities = groupDocumentLineQuantities(documentItems);
					const capacityError = validateDocumentLineCapacity(document, groupedQuantities);
					if (capacityError) return fail(422, capacityError);

					items = results.map((result) => result.item!);
				}
			}

			const isCorrection = existing.status === 'failed';
			const now = new Date().toISOString();
			const updated: IStockReceipt = {
				...existing,
				warehouse,
				branch_id: branchId,
				supplier: supplierCompact,
				received_on: receivedOn,
				notes: Object.prototype.hasOwnProperty.call(payload, 'notes')
					? payload.notes?.trim() || null
					: existing.notes,
				reason:
					isManual && Object.prototype.hasOwnProperty.call(payload, 'reason')
						? (payload.reason?.trim() ?? existing.reason)
						: existing.reason,
				items,
				items_count: items.length,
				total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
				// Corregir una recepción `failed` la vuelve a `draft` y limpia el
				// error visible, conservando `processing` como historia de
				// intentos (sección 7). Reintentar directo (`retry`) la conserva.
				status: isCorrection ? 'draft' : existing.status,
				// `existing.status` sólo puede ser `draft`/`failed` acá: la
				// validación de estado de arriba ya rechazó cualquier otro valor
				// (incluido `posted`, que no tiene entrada en esta tabla estática) —
				// TS ya lo tiene narrowed, sin necesitar una aserción.
				allowed_actions:
					ALLOWED_ACTIONS_BY_STATUS[isCorrection ? 'draft' : existing.status],
				failure_code: isCorrection ? null : existing.failure_code,
				failure_message: isCorrection ? null : existing.failure_message,
				failed_at: isCorrection ? null : existing.failed_at,
				updated_at: now,
			};

			store.receipts = store.receipts.map((receipt) =>
				receipt.id === id ? updated : receipt,
			);
			const nextVersion = bumpVersion(store, id);

			return delay({
				data: cloneReceipt(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `POST /stock-receipts/{receipt}/cancel`: `draft`/`failed` → `cancelled`.
 * Motivo obligatorio; sin efecto físico.
 */
export const cancelStockReceipt = (
	subsidiaryId: number,
	id: number,
	payload: IStockReceiptCancelPayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'cancel', id, payload }, () =>
		withReceiptLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.receipts.find((receipt) => receipt.id === id);
			if (!existing) {
				return fail(404, {
					message: 'La recepción no existe.',
					code: 'STOCK_RECEIPT_NOT_FOUND',
				});
			}
			if (existing.status !== 'draft' && existing.status !== 'failed') {
				return fail(409, {
					message: 'La recepción no se puede anular en este estado.',
					code: 'STOCK_RECEIPT_NOT_CANCELLABLE',
				});
			}
			if (!payload.reason?.trim()) {
				return fail(
					422,
					buildFieldError(
						'CANCELLATION_REASON_REQUIRED',
						'Indica el motivo de anulación.',
						'reason',
					),
				);
			}

			const updated: IStockReceipt = {
				...existing,
				status: 'cancelled',
				cancellation_reason: payload.reason.trim(),
				allowed_actions: ALLOWED_ACTIONS_BY_STATUS.cancelled,
				updated_at: new Date().toISOString(),
			};
			store.receipts = store.receipts.map((receipt) =>
				receipt.id === id ? updated : receipt,
			);
			const nextVersion = bumpVersion(store, id);

			if (existing.purchase_document) {
				bumpPurchaseDocumentStockReceiptsCount(
					subsidiaryId,
					existing.purchase_document.id,
					-1,
				);
			}

			return delay({
				data: cloneReceipt(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `POST /stock-receipts/{receipt}/post`: `draft` → `queued`. Responde de
 * inmediato con la recepción `queued` (equivalente mock del 202): **no**
 * espera al worker. `actor` es quien solicita contabilizar — se guarda para
 * `posted_by` cuando el worker resuelva a `posted`.
 */
export const postStockReceipt = (
	subsidiaryId: number,
	id: number,
	actor: IProcurementActorCompact,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'post', id }, () =>
		withReceiptLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.receipts.find((receipt) => receipt.id === id);
			if (!existing) {
				return fail(404, {
					message: 'La recepción no existe.',
					code: 'STOCK_RECEIPT_NOT_FOUND',
				});
			}
			if (existing.status !== 'draft') {
				return fail(409, {
					message: PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_ALREADY_POSTED.fallbackMessage,
					code: 'RECEIPT_ALREADY_POSTED',
				});
			}

			const now = new Date().toISOString();
			const updated: IStockReceipt = {
				...existing,
				status: 'queued',
				queued_at: now,
				allowed_actions: ALLOWED_ACTIONS_BY_STATUS.queued,
				processing: {
					attempt_count: existing.processing.attempt_count + 1,
					last_attempt_at: now,
					next_retry_at: null,
				},
				updated_at: now,
			};
			store.receipts = store.receipts.map((receipt) =>
				receipt.id === id ? updated : receipt,
			);
			const nextVersion = bumpVersion(store, id);

			requestedByByReceipt.set(storeKey(subsidiaryId, id), actor);
			scheduleWorker(subsidiaryId, id);

			return delay({
				data: cloneReceipt(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `POST /stock-receipts/{receipt}/retry`: `failed` → `queued` directo, sin
 * tocar el payload — «reintentar directo la conserva» (sección 7), a
 * diferencia de `update` sobre una `failed`, que sí corrige y vuelve a
 * `draft`.
 */
export const retryStockReceipt = (
	subsidiaryId: number,
	id: number,
	actor: IProcurementActorCompact,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'retry', id }, () =>
		withReceiptLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.receipts.find((receipt) => receipt.id === id);
			if (!existing) {
				return fail(404, {
					message: 'La recepción no existe.',
					code: 'STOCK_RECEIPT_NOT_FOUND',
				});
			}
			if (existing.status !== 'failed') {
				return fail(409, {
					message: 'Sólo se puede reintentar una recepción fallida.',
					code: 'STOCK_RECEIPT_NOT_FAILED',
				});
			}

			const now = new Date().toISOString();
			const updated: IStockReceipt = {
				...existing,
				status: 'queued',
				queued_at: now,
				failed_at: null,
				failure_code: null,
				failure_message: null,
				allowed_actions: ALLOWED_ACTIONS_BY_STATUS.queued,
				processing: {
					attempt_count: existing.processing.attempt_count + 1,
					last_attempt_at: now,
					next_retry_at: null,
				},
				updated_at: now,
			};
			store.receipts = store.receipts.map((receipt) =>
				receipt.id === id ? updated : receipt,
			);
			const nextVersion = bumpVersion(store, id);

			requestedByByReceipt.set(storeKey(subsidiaryId, id), actor);
			scheduleWorker(subsidiaryId, id);

			return delay({
				data: cloneReceipt(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `POST /stock-receipts/{receipt}/reverse`: `posted` → `reversed`, motivo
 * obligatorio. Si las unidades ya se consumieron: `409
 * RECEIPT_ALREADY_CONSUMED` — el mock lo simula con
 * `STOCK_RECEIPT_CONSUMED_IDS` (el contrato no modela consumo real dentro de
 * este módulo). Libera la cobertura del documento vinculado, si existe.
 */
export const reverseStockReceipt = (
	subsidiaryId: number,
	id: number,
	payload: IStockReceiptReversePayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'reverse', id, payload }, () =>
		withReceiptLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.receipts.find((receipt) => receipt.id === id);
			if (!existing) {
				return fail(404, {
					message: 'La recepción no existe.',
					code: 'STOCK_RECEIPT_NOT_FOUND',
				});
			}
			if (existing.status !== 'posted') {
				return fail(409, {
					message: PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_NOT_POSTED.fallbackMessage,
					code: 'RECEIPT_NOT_POSTED',
				});
			}
			if (!payload.reason?.trim()) {
				return fail(
					422,
					buildFieldError(
						'REVERSAL_REASON_REQUIRED',
						'Indica el motivo de la reversión.',
						'reason',
					),
				);
			}
			if (STOCK_RECEIPT_CONSUMED_IDS.has(existing.id)) {
				return fail(409, {
					message: PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_ALREADY_CONSUMED.fallbackMessage,
					code: 'RECEIPT_ALREADY_CONSUMED',
				});
			}

			if (existing.purchase_document) {
				applyStockReceiptCoverageDelta(
					subsidiaryId,
					existing.purchase_document.id,
					existing.branch_id,
					existing.warehouse,
					groupQuantityByLine(existing.items).map((allocation) => ({
						...allocation,
						quantityDelta: -allocation.quantityDelta,
					})),
				);
			}

			const now = new Date().toISOString();
			const updated: IStockReceipt = {
				...existing,
				status: 'reversed',
				reversed_at: now,
				reversal_reason: payload.reason.trim(),
				reversal_operation_id: crypto.randomUUID(),
				allowed_actions: ALLOWED_ACTIONS_BY_STATUS.reversed,
				updated_at: now,
			};
			store.receipts = store.receipts.map((receipt) =>
				receipt.id === id ? updated : receipt,
			);
			const nextVersion = bumpVersion(store, id);

			return delay({
				data: cloneReceipt(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/** Agrega una línea de auditoría a `notes`, conservando lo que ya hubiera. */
const appendAuditNote = (existingNotes: string | null, note: string): string =>
	existingNotes ? `${existingNotes}\n${note}` : note;

/**
 * `PUT /stock-receipts/{receipt}/purchase-document` (card 07, sección 8):
 * vincula un documento `confirmed` a una recepción `posted` que se creó sin
 * uno. Mapea **todas** las líneas de la recepción al mismo documento,
 * validando producto/cantidad/capacidad — reutiliza exactamente
 * `validateDocumentLineCapacity`/`groupDocumentLineQuantities`, el mismo
 * criterio agregado (hallazgo 2) que ya usa el alta con documento.
 *
 * Decisiones no especificadas literalmente en el contrato (sección 8):
 * - **Recepción no `posted`**: el contrato no da un código específico para
 *   este caso — se reutiliza `RECEIPT_NOT_POSTED` (sección 16), que ya
 *   significa exactamente eso («la recepción todavía no está contabilizada»)
 *   para la reversión; inventar uno paralelo duplicaría el mismo significado.
 * - **Proveedor no coincide**: tampoco hay código estable. Se define
 *   `RECEIPT_DOCUMENT_SUPPLIER_MISMATCH` como código propio del mock (ver
 *   `RECEIPT_DOCUMENT_SUPPLIER_MISMATCH_MESSAGE` en `procurementErrors.util`),
 *   misma licencia que los códigos propios de documentos de compra.
 * - **Capacidad excedida**: se reutiliza `RECEIPT_EXCEEDS_DOCUMENT` — el
 *   contrato usa ese código para «la recepción supera lo pendiente del
 *   documento» al crear con documento; acá es la misma comprobación, sólo que
 *   retroactiva.
 * - **Auditoría del motivo**: el contrato exige `reason` obligatorio pero no
 *   declara un campo propio para conservarlo en `IStockReceipt` (a diferencia
 *   de `reversal_reason`/`cancellation_reason`, que sí son campos explícitos
 *   de la sección 7). Se audita agregando una línea a `notes`, igual criterio
 *   que el resto de este archivo usa para no inventar un campo de contrato
 *   que no existe.
 *
 * No cambia `received_on`, no genera movimiento físico, no reencola el
 * worker y no altera `status` — sólo refleja, sobre el documento, la
 * cobertura que esta recepción nunca aplicó por no tener documento al
 * publicarse (`applyStockReceiptCoverageDelta`, la misma función que usa
 * publicar/revertir).
 */
export const linkStockReceiptPurchaseDocument = (
	subsidiaryId: number,
	id: number,
	payload: IStockReceiptLinkPurchaseDocumentPayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IStockReceipt; headers: { etag: string } }> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'link_purchase_document', id, payload },
		() =>
			withReceiptLock(subsidiaryId, id, async () => {
				const store = getStore(subsidiaryId);
				const existing = store.receipts.find((receipt) => receipt.id === id);
				if (!existing) {
					return fail(404, {
						message: 'La recepción no existe.',
						code: 'STOCK_RECEIPT_NOT_FOUND',
					});
				}
				if (existing.status !== 'posted') {
					return fail(409, {
						message: PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_NOT_POSTED.fallbackMessage,
						code: 'RECEIPT_NOT_POSTED',
					});
				}
				// Vínculo único, no sustituible (sección 8): una vez hecho, no se
				// cambia.
				if (existing.purchase_document) {
					return fail(409, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.RECEIPT_DOCUMENT_ALREADY_LINKED
								.fallbackMessage,
						code: 'RECEIPT_DOCUMENT_ALREADY_LINKED',
					});
				}
				if (!payload.reason?.trim()) {
					return fail(
						422,
						buildFieldError(
							'LINK_REASON_REQUIRED',
							'Indica el motivo del vínculo posterior.',
							'reason',
						),
					);
				}

				// Sección 8: «mapear todas las líneas al mismo documento» — ninguna
				// línea de la recepción puede quedar sin mapear, y no se aceptan
				// líneas ajenas a esta recepción.
				const receiptLineIds = new Set(existing.items.map((item) => item.id));
				const mappedLineIds = new Set(
					(payload.items ?? []).map((item) => item.stock_receipt_line_id),
				);
				const coversAllReceiptLines =
					Array.isArray(payload.items) &&
					payload.items.length === existing.items.length &&
					mappedLineIds.size === existing.items.length &&
					existing.items.every((item) => mappedLineIds.has(item.id)) &&
					payload.items.every((item) => receiptLineIds.has(item.stock_receipt_line_id));
				if (!coversAllReceiptLines) {
					return fail(422, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
						code: 'DOCUMENT_LINE_MISMATCH',
					});
				}

				const document = findPurchaseDocumentForReceipts(
					subsidiaryId,
					payload.purchase_document_id,
				);
				if (!document) {
					return fail(
						422,
						buildFieldError(
							'PURCHASE_DOCUMENT_NOT_FOUND',
							'El documento de compra no existe.',
							'purchase_document_id',
						),
					);
				}
				if (document.status !== 'confirmed') {
					return fail(422, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_NOT_CONFIRMED.fallbackMessage,
						code: 'DOCUMENT_NOT_CONFIRMED',
					});
				}

				const documentLineById = new Map(document.items.map((line) => [line.id, line]));
				const receiptLineById = new Map(existing.items.map((item) => [item.id, item]));

				// Producto compatible: cada línea de recepción debe corresponder al
				// mismo producto que la línea de documento a la que se mapea.
				const mismatchedProduct = payload.items.some((mapping) => {
					const documentLine = documentLineById.get(mapping.purchase_document_line_id);
					const receiptLine = receiptLineById.get(mapping.stock_receipt_line_id);
					return (
						!documentLine ||
						!receiptLine ||
						documentLine.product.id !== receiptLine.product.id
					);
				});
				if (mismatchedProduct) {
					return fail(422, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
						code: 'DOCUMENT_LINE_MISMATCH',
					});
				}

				// Capacidad agregada y vigente (hallazgo 2): el documento todavía no
				// tiene cobertura de esta recepción — se posteó sin documento — así
				// que `remaining_quantity` vigente es la capacidad real disponible.
				const groupedQuantities = new Map<number, number>();
				payload.items.forEach((mapping) => {
					const receiptLine = receiptLineById.get(mapping.stock_receipt_line_id)!;
					groupedQuantities.set(
						mapping.purchase_document_line_id,
						(groupedQuantities.get(mapping.purchase_document_line_id) ?? 0) +
							receiptLine.quantity,
					);
				});
				const capacityError = validateDocumentLineCapacity(document, groupedQuantities);
				if (capacityError) return fail(422, capacityError);

				// Proveedor: si la recepción ya tenía uno conocido, debe coincidir;
				// si no, se completa desde el documento (sección 8).
				if (existing.supplier && existing.supplier.id !== document.supplier?.id) {
					return fail(422, {
						message: RECEIPT_DOCUMENT_SUPPLIER_MISMATCH_MESSAGE,
						code: 'RECEIPT_DOCUMENT_SUPPLIER_MISMATCH',
					});
				}

				const now = new Date().toISOString();
				const items = existing.items.map((item) => {
					const mapping = payload.items.find(
						(entry) => entry.stock_receipt_line_id === item.id,
					)!;
					const documentLine = documentLineById.get(mapping.purchase_document_line_id)!;
					return {
						...item,
						purchase_document_line_id: documentLine.id,
						// El costo documental prevalece sobre el declarado y su cambio
						// queda auditado (sección 8): `source: "document"` reemplaza
						// cualquier costo declarado que la línea tuviera.
						cost: documentLine.cost,
					};
				});

				const updated: IStockReceipt = {
					...existing,
					supplier: existing.supplier ?? document.supplier,
					purchase_document: {
						id: document.id,
						document_type: document.document_type,
						document_number: document.document_number,
						issue_date: document.issue_date,
					},
					items,
					allowed_actions: computeAllowedActionsForStatus('posted', true),
					notes: appendAuditNote(
						existing.notes,
						`Documento #${document.document_number} vinculado después de contabilizar: ${payload.reason.trim()}`,
					),
					updated_at: now,
				};
				store.receipts = store.receipts.map((receipt) =>
					receipt.id === id ? updated : receipt,
				);
				const nextVersion = bumpVersion(store, id);

				// Refleja la cobertura como si la recepción se hubiese creado con
				// este documento desde el principio (sección 8) — no cambia
				// `received_on`, no genera movimiento físico ni reencola el worker.
				applyStockReceiptCoverageDelta(
					subsidiaryId,
					document.id,
					existing.branch_id,
					existing.warehouse,
					Array.from(groupedQuantities.entries()).map(([lineId, quantityDelta]) => ({
						lineId,
						quantityDelta,
					})),
				);
				bumpPurchaseDocumentStockReceiptsCount(subsidiaryId, document.id, 1);

				return delay({
					data: cloneReceipt(updated),
					headers: { etag: buildEtag(id, nextVersion) },
				});
			}),
	);

/**
 * Sólo para pruebas: descarta el estado **en memoria** — como una recarga
 * real de la pestaña, que reinstancia el módulo y pierde todo `setTimeout` —
 * pero conserva deliberadamente lo persistido en `localStorage` (hallazgo 1).
 * `forcedOutcomeByReceipt` también se descarta: es control de pruebas, no
 * estado del mock, así que una prueba que reanuda tras «recargar» debe
 * volver a fijarlo si necesita un resultado específico del worker.
 */
export const simulateStockReceiptsReloadForTests = (): void => {
	pendingWorkerTimers.forEach((timer) => clearTimeout(timer));
	pendingWorkerTimers.clear();
	storesBySubsidiary.clear();
	nextReceiptIdBySubsidiary.clear();
	nextItemIdBySubsidiary.clear();
	idempotencyLog.clear();
	requestedByByReceipt.clear();
	forcedOutcomeByReceipt.clear();
	reconciledSubsidiaries.clear();
};

/**
 * Sólo para pruebas: reinicia el store a la semilla de fixtures, incluida la
 * persistencia (a diferencia de `simulateStockReceiptsReloadForTests`, que
 * conserva `localStorage` a propósito para probar justamente la
 * supervivencia a una recarga).
 */
export const resetStockReceiptsStoreForTests = (): void => {
	simulateStockReceiptsReloadForTests();
	clearAllPersistedMockState(STOCK_RECEIPTS_STORAGE_NAMESPACE);
};
