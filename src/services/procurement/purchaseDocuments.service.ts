import {
	purchaseDocuments as documentSeed,
	purchasableProcurementProducts,
} from '@/mocks/db/procurement.db';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
import {
	clearAllPersistedMockState,
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';
import {
	PROCUREMENT_ERROR_DEFINITIONS,
	PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS_MESSAGE,
	PURCHASE_DOCUMENT_ITEMS_EMPTY_MESSAGE,
	PURCHASE_DOCUMENT_NOT_DRAFT_MESSAGE,
} from '@/utils/procurementErrors.util';
import { formatDecimalCents, parseDecimalString } from '@/utils/procurementDecimal.util';
import { PROCUREMENT_VAT_RATE_PERCENT, previewCostBreakdown } from '@/utils/procurementCost.util';
import { normalizePageParams } from '@/utils/procurementPagination.util';
import type {
	IApiCollectionEnvelope,
	IProcurementCost,
	IProcurementSupplier,
	IPurchaseDocument,
	IPurchaseDocumentCancelPayload,
	IPurchaseDocumentCreatePayload,
	IPurchaseDocumentLine,
	IPurchaseDocumentLineInput,
	IPurchaseDocumentListParams,
	IPurchaseDocumentListRow,
	IPurchaseDocumentUpdatePayload,
	ISupplierCompact,
	IWarehouseCompact,
	TCostEntryBasis,
	TPurchaseDocumentType,
} from '@/interface/procurement.interface';

/**
 * Servicio mock de documentos de compra — sección 6 del contrato de
 * abastecimiento (`frontend-guide.md`, PR #67 del backend, rama
 * `docs/procurement-stock-receipts`).
 *
 * **Ninguno de estos endpoints existe todavía.** Simula
 * `/api/subsidiaries/{subsidiary}/procurement/purchase-documents` contra un
 * store en memoria particionado por filial, con `ETag`/`If-Match` e
 * `Idempotency-Key` reales — la misma disciplina que
 * `procurementSuppliers.service`, más la concurrencia optimista que ese
 * servicio no necesitaba.
 *
 * Reutiliza `getProcurementSupplier` del servicio de proveedores (card 02)
 * para resolver el compacto y el snapshot: ambos módulos comparten el mismo
 * store de proveedores particionado por filial, así que un proveedor
 * desactivado o editado ahí se refleja acá sin duplicar el fixture.
 */

const MOCK_LATENCY_MS = 220;

interface IPurchaseDocumentVersionedStore {
	documents: IPurchaseDocument[];
	/** Versión por documento, para construir el `ETag` de GET/escritura. */
	versions: Map<number, number>;
}

const cloneDocument = (document: IPurchaseDocument): IPurchaseDocument => ({
	...document,
	supplier: document.supplier ? { ...document.supplier } : null,
	supplier_snapshot: document.supplier_snapshot ? { ...document.supplier_snapshot } : null,
	related_counts: { ...document.related_counts },
	items: document.items.map((item) => ({
		...item,
		received_distribution: item.received_distribution.map((row) => ({
			...row,
			warehouse: row.warehouse ? { ...row.warehouse } : null,
		})),
	})),
});

const seedStore = (): IPurchaseDocumentVersionedStore => ({
	documents: documentSeed.map(cloneDocument),
	versions: new Map(documentSeed.map((document) => [document.id, 1])),
});

const storesBySubsidiary = new Map<number, IPurchaseDocumentVersionedStore>();
const nextDocumentIdBySubsidiary = new Map<number, number>();
const nextLineIdBySubsidiary = new Map<number, number>();

const seedNextDocumentId = (): number =>
	Math.max(...documentSeed.map((document) => document.id)) + 1;
const seedNextLineId = (): number =>
	Math.max(...documentSeed.flatMap((document) => document.items.map((item) => item.id))) + 1;

interface IIdempotencyLogEntry {
	payloadHash: string;
	/** `undefined` mientras la operación sigue en curso. */
	result?: unknown;
}

const idempotencyLog = new Map<string, IIdempotencyLogEntry>();
const idempotencyLogKey = (subsidiaryId: number, key: string): string => `${subsidiaryId}:${key}`;

/**
 * Persistencia local del store autoritativo (hallazgo 1, revisión ZF-110):
 * ver `procurementMockPersistence.util`. Sin esto, la cobertura que refleja
 * una recepción publicada (`applyStockReceiptCoverageDelta`) se perdía al
 * recargar la pestaña — persistir sólo el slice de UI de recepciones no
 * alcanza si el documento vinculado vuelve a nacer desde cero.
 */
const PURCHASE_DOCUMENTS_STORAGE_NAMESPACE = 'purchase-documents';
const PURCHASE_DOCUMENTS_STORAGE_VERSION = 1;

interface IPersistedPurchaseDocumentsState {
	documents: IPurchaseDocument[];
	versions: [number, number][];
	nextDocumentId: number;
	nextLineId: number;
	idempotency: [string, IIdempotencyLogEntry][];
}

const hydrateStoreFromStorage = (subsidiaryId: number): IPurchaseDocumentVersionedStore | null => {
	const persisted = loadPersistedMockState<IPersistedPurchaseDocumentsState>(
		PURCHASE_DOCUMENTS_STORAGE_NAMESPACE,
		PURCHASE_DOCUMENTS_STORAGE_VERSION,
		subsidiaryId,
	);
	if (!persisted) return null;

	nextDocumentIdBySubsidiary.set(subsidiaryId, persisted.nextDocumentId);
	nextLineIdBySubsidiary.set(subsidiaryId, persisted.nextLineId);
	persisted.idempotency.forEach(([key, entry]) => {
		idempotencyLog.set(idempotencyLogKey(subsidiaryId, key), entry);
	});

	return { documents: persisted.documents, versions: new Map(persisted.versions) };
};

/** Serializa y guarda el estado autoritativo vigente de una filial (hallazgo 1). */
const persistSubsidiaryState = (subsidiaryId: number): void => {
	const store = storesBySubsidiary.get(subsidiaryId);
	if (!store) return;

	const prefix = `${subsidiaryId}:`;
	const idempotency: [string, IIdempotencyLogEntry][] = [];
	idempotencyLog.forEach((entry, key) => {
		if (key.startsWith(prefix)) idempotency.push([key.slice(prefix.length), entry]);
	});

	const payload: IPersistedPurchaseDocumentsState = {
		documents: store.documents,
		versions: Array.from(store.versions.entries()),
		nextDocumentId: nextDocumentIdBySubsidiary.get(subsidiaryId) ?? seedNextDocumentId(),
		nextLineId: nextLineIdBySubsidiary.get(subsidiaryId) ?? seedNextLineId(),
		idempotency,
	};
	savePersistedMockState(
		PURCHASE_DOCUMENTS_STORAGE_NAMESPACE,
		PURCHASE_DOCUMENTS_STORAGE_VERSION,
		subsidiaryId,
		payload,
	);
};

const getStore = (subsidiaryId: number): IPurchaseDocumentVersionedStore => {
	let store = storesBySubsidiary.get(subsidiaryId);
	if (store === undefined) {
		store = hydrateStoreFromStorage(subsidiaryId) ?? seedStore();
		storesBySubsidiary.set(subsidiaryId, store);
	}
	return store;
};

const nextDocumentIdFor = (subsidiaryId: number): number => {
	const current = nextDocumentIdBySubsidiary.get(subsidiaryId) ?? seedNextDocumentId();
	nextDocumentIdBySubsidiary.set(subsidiaryId, current + 1);
	return current;
};

const nextLineIdFor = (subsidiaryId: number): number => {
	const current = nextLineIdBySubsidiary.get(subsidiaryId) ?? seedNextLineId();
	nextLineIdBySubsidiary.set(subsidiaryId, current + 1);
	return current;
};

/** `ETag` opaco: no es información que el cliente deba interpretar. */
const buildEtag = (documentId: number, version: number): string =>
	`W/"pd-${documentId}-v${version}"`;

const bumpVersion = (store: IPurchaseDocumentVersionedStore, documentId: number): number => {
	const next = (store.versions.get(documentId) ?? 0) + 1;
	store.versions.set(documentId, next);
	return next;
};

const delay = <T>(value: T): Promise<T> =>
	new Promise((resolve) => {
		setTimeout(() => resolve(value), MOCK_LATENCY_MS);
	});

interface IMockWriteHeaders {
	idempotencyKey?: string;
	/** `ETag` vigente que el llamador leyó del GET/escritura anterior. */
	etag?: string | null;
}

const apiError = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true as const,
	response: { status, data },
});

const fail = (status: number, data: Record<string, unknown>): Promise<never> =>
	Promise.reject(apiError(status, data));

/**
 * Reserva la clave **antes** del primer `await` (síncrono, dentro del mismo
 * tick): sin esto, dos llamadas concurrentes con la misma clave llegan las
 * dos con `idempotencyLog.get(logKey) === undefined` y ejecutan `run()` en
 * paralelo — el contrato exige `409 OPERATION_IN_PROGRESS` para la segunda
 * mientras la primera sigue en curso (sección 1). Un fallo definitivo borra
 * la reserva: sólo una escritura **exitosa** consume la clave, igual que
 * documenta el comentario original de este servicio.
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
		// Persiste después de fijar el resultado idempotente definitivo (hallazgo
		// 1): persistir antes congelaría la clave en «en curso» para siempre si
		// la pestaña se recarga justo en este instante.
		persistSubsidiaryState(subsidiaryId);
		return result;
	} catch (error) {
		idempotencyLog.delete(logKey);
		throw error;
	}
}

/**
 * Serializa las escrituras sobre un mismo documento. El `ETag` protege
 * contra pisar una edición ajena, pero la validación (estado, `If-Match`,
 * las esperas a `getProcurementSupplier`) y la escritura final no son un
 * único paso atómico: dos escrituras concurrentes con claves de idempotencia
 * **distintas** podían intercalarse entre esa validación y el commit,
 * perdiendo la de la que resolvió primero. Encolar por documento cierra esa
 * ventana sin necesitar una base de datos real detrás.
 *
 * **Exportada a propósito:** `purchaseDocumentAttachments.service` muta el
 * mismo `document` (su `related_counts.attachments` y su versión) y debe
 * encolarse en esta misma cola, no en una propia — dos colas separadas para
 * el mismo documento no se excluyen mutuamente entre sí, así que una
 * actualización de líneas y una subida de adjunto podían intercalar su
 * lectura-modificación-escritura de `store.documents` y perder una de las
 * dos escrituras.
 */
const documentLocks = new Map<string, Promise<unknown>>();

export function withDocumentLock<T>(
	subsidiaryId: number,
	documentId: number,
	run: () => Promise<T>,
): Promise<T> {
	const lockKey = `${subsidiaryId}:${documentId}`;
	const previous = documentLocks.get(lockKey) ?? Promise.resolve();
	const next = previous.then(run, run);
	// La cola sigue viva aunque esta escritura falle: sólo se limpia el
	// resultado, nunca el turno de la siguiente en espera.
	documentLocks.set(
		lockKey,
		next.catch(() => undefined),
	);
	return next;
}

const buildFieldError = (
	code: string,
	message: string,
	field: string,
): Record<string, unknown> => ({ message, code, errors: { [field]: [message] } });

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

const searchMatchesDocument = (document: IPurchaseDocument, search: string): boolean => {
	const needle = search.trim().toLocaleLowerCase('es-CL');
	if (!needle) return true;

	return [document.document_number, document.supplier?.display_name, document.supplier?.rut].some(
		(value) => Boolean(value) && value!.toLocaleLowerCase('es-CL').includes(needle),
	);
};

/**
 * Costo de una línea de documento de compra. `source: "document"` porque la
 * línea siempre pertenece a un documento (a diferencia de una recepción sin
 * documento, `source: "declared"`, fuera del alcance de este servicio).
 * `effective_basis` lo decide el **tipo documental**, no la base ingresada:
 * factura → neto (premisa de IVA recuperable), boleta → bruto (no
 * recuperable) — igual que `grossEnteredCost`/`netEnteredCost` del fixture.
 */
const buildLineCost = (
	amount: string,
	basis: TCostEntryBasis,
	documentType: TPurchaseDocumentType,
	currencyCode: string,
): IProcurementCost | null => {
	const breakdown = previewCostBreakdown(amount, basis);
	if (!breakdown) return null;

	const enteredCents = parseDecimalString(amount);
	if (enteredCents === null) return null;

	const effectiveBasis = documentType === 'invoice' ? 'net' : 'gross';

	return {
		currency_code: currencyCode,
		entered_unit_amount: formatDecimalCents(enteredCents),
		entered_basis: basis,
		vat_rate_percent: PROCUREMENT_VAT_RATE_PERCENT,
		net_unit_amount: breakdown.net_unit_amount,
		vat_unit_amount: breakdown.vat_unit_amount,
		gross_unit_amount: breakdown.gross_unit_amount,
		effective_unit_amount:
			effectiveBasis === 'net' ? breakdown.net_unit_amount : breakdown.gross_unit_amount,
		effective_basis: effectiveBasis,
		source: 'document',
		calculation: 'single_price',
	};
};

interface IBuildLineResult {
	line?: IPurchaseDocumentLine;
	error?: Record<string, unknown>;
}

/**
 * Construye una línea de documento, nueva o reconstruida a partir de una
 * existente (`existingId`). Siempre nace/vuelve a nacer con cobertura en
 * cero: un documento en `draft` nunca tuvo una recepción contra él — las
 * recepciones sólo se cuentan contra documentos `confirmed` — así que
 * reconstruir una línea al editar no arrastra cobertura que no existía.
 */
const buildLine = (
	subsidiaryId: number,
	input: IPurchaseDocumentLineInput,
	documentType: TPurchaseDocumentType,
	currencyCode: string,
	existingId?: number,
): IBuildLineResult => {
	const product = purchasableProcurementProducts.find((item) => item.id === input.product_id);
	if (!product) {
		return {
			error: buildFieldError(
				'PURCHASE_DOCUMENT_PRODUCT_INVALID',
				'El producto no es válido para un documento de compra (debe ser no serializado y de la filial).',
				'product_id',
			),
		};
	}
	if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
		return {
			error: buildFieldError(
				'PURCHASE_DOCUMENT_QUANTITY_INVALID',
				'La cantidad debe ser un entero positivo.',
				'quantity',
			),
		};
	}
	if (!input.unit_cost || !input.unit_cost_basis) {
		return {
			error: buildFieldError(
				!input.unit_cost ? 'UNIT_COST_REQUIRED' : 'UNIT_COST_BASIS_REQUIRED',
				!input.unit_cost
					? PROCUREMENT_ERROR_DEFINITIONS.UNIT_COST_REQUIRED.fallbackMessage
					: PROCUREMENT_ERROR_DEFINITIONS.UNIT_COST_BASIS_REQUIRED.fallbackMessage,
				'unit_cost',
			),
		};
	}

	const cost = buildLineCost(input.unit_cost, input.unit_cost_basis, documentType, currencyCode);
	if (!cost) {
		return {
			error: buildFieldError(
				'UNIT_COST_REQUIRED',
				'El costo unitario no es válido.',
				'unit_cost',
			),
		};
	}

	return {
		line: {
			id: existingId ?? nextLineIdFor(subsidiaryId),
			product,
			sku_snapshot: product.sku,
			name_snapshot: product.name,
			quantity: input.quantity,
			cost,
			notes: input.notes?.trim() || null,
			received_quantity: 0,
			initial_stock_allocated_quantity: 0,
			accounted_quantity: 0,
			remaining_quantity: input.quantity,
			received_distribution: [],
		},
	};
};

interface IBuildLinesResult {
	lines?: IPurchaseDocumentLine[];
	error?: Record<string, unknown>;
}

/** Construye todas las líneas de un alta: cada una nace, ninguna se reconstruye. */
const buildNewLines = (
	subsidiaryId: number,
	items: IPurchaseDocumentLineInput[],
	documentType: TPurchaseDocumentType,
	currencyCode: string,
): IBuildLinesResult => {
	const results = items.map((input) =>
		buildLine(subsidiaryId, input, documentType, currencyCode),
	);
	const failed = results.find((result) => result.error);
	if (failed) return { error: failed.error };

	return { lines: results.map((result) => result.line!) };
};

/**
 * Reemplaza la colección completa de líneas en `PATCH` (sección 6): línea
 * con `id` conocido se reconstruye, sin `id` nace, la que no aparece queda
 * fuera al asignar el resultado. Un `id` que no pertenece al documento es
 * `DOCUMENT_LINE_MISMATCH`.
 */
const replaceExistingLines = (
	subsidiaryId: number,
	existingItems: IPurchaseDocumentLine[],
	items: IPurchaseDocumentLineInput[],
	documentType: TPurchaseDocumentType,
	currencyCode: string,
): IBuildLinesResult => {
	const existingById = new Map(existingItems.map((line) => [line.id, line]));
	const results: IBuildLineResult[] = items.map((input) => {
		if (input.id === undefined)
			return buildLine(subsidiaryId, input, documentType, currencyCode);

		const existingLine = existingById.get(input.id);
		if (!existingLine) {
			return {
				error: {
					message: PROCUREMENT_ERROR_DEFINITIONS.DOCUMENT_LINE_MISMATCH.fallbackMessage,
					code: 'DOCUMENT_LINE_MISMATCH',
				},
			};
		}
		return buildLine(subsidiaryId, input, documentType, currencyCode, existingLine.id);
	});

	const failed = results.find((result) => result.error);
	if (failed) return { error: failed.error };

	return { lines: results.map((result) => result.line!) };
};

/**
 * `true` cuando el proveedor tiene giro y ambas direcciones — lo que exige
 * confirmar una factura (sección 5). Mismo criterio que
 * `isIncompleteForInvoicing` del formulario de proveedores, aplicado acá
 * sobre la ficha completa en vez de los valores del form.
 *
 * Incluye las comunas a propósito, aunque el texto de la sección 5 sólo
 * nombra «giro y ambas direcciones»: `SupplierCompletenessNotice` (card 02)
 * ya advierte al usuario con este mismo criterio —comuna incluida— antes de
 * llegar a confirmar una factura. Que el aviso de proveedores y el bloqueo
 * de confirmar acá exijan cosas distintas sería peor que ser un poco más
 * estricto que la frase literal del contrato.
 */
const isSupplierCompleteForInvoicing = (supplier: IProcurementSupplier): boolean =>
	Boolean(supplier.business_activity?.trim()) &&
	Boolean(supplier.billing_address?.trim()) &&
	supplier.billing_commune_id !== null &&
	Boolean(supplier.shipping_address?.trim()) &&
	supplier.shipping_commune_id !== null;

const toSupplierCompact = (supplier: IProcurementSupplier): ISupplierCompact => ({
	id: supplier.id,
	display_name: supplier.display_name,
	rut: supplier.rut,
	is_active: supplier.is_active,
});

/**
 * `GET /purchase-documents`. `search` corre sobre folio, proveedor y RUT.
 * Orden `issue_date` DESC, ID DESC (sección 6).
 */
export const listPurchaseDocuments = (
	subsidiaryId: number,
	params: IPurchaseDocumentListParams = {},
): Promise<IApiCollectionEnvelope<IPurchaseDocumentListRow>> => {
	const store = getStore(subsidiaryId);
	let filtered = store.documents;

	if (params.document_type)
		filtered = filtered.filter((doc) => doc.document_type === params.document_type);
	if (params.status) filtered = filtered.filter((doc) => doc.status === params.status);
	if (params.reception_status)
		filtered = filtered.filter((doc) => doc.reception_status === params.reception_status);
	if (params.supplier_id !== undefined)
		filtered = filtered.filter((doc) => doc.supplier?.id === params.supplier_id);
	if (params.issued_from)
		filtered = filtered.filter((doc) => doc.issue_date >= params.issued_from!);
	if (params.issued_to) filtered = filtered.filter((doc) => doc.issue_date <= params.issued_to!);
	if (params.search)
		filtered = filtered.filter((doc) => searchMatchesDocument(doc, params.search!));

	const sorted = [...filtered].sort(
		(left, right) => right.issue_date.localeCompare(left.issue_date) || right.id - left.id,
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
			path: `/api/subsidiaries/${subsidiaryId}/procurement/purchase-documents`,
			per_page: perPage,
			to: total === 0 ? null : Math.min(start + perPage, total),
			total,
		},
	});
};

/** `GET /purchase-documents/{document}`: detalle con `ETag`. */
export const getPurchaseDocument = (
	subsidiaryId: number,
	id: number,
): Promise<{ data: IPurchaseDocument; headers: { etag: string } }> => {
	const store = getStore(subsidiaryId);
	const document = store.documents.find((item) => item.id === id);
	if (!document) {
		return fail(404, {
			message: 'El documento de compra no existe.',
			code: 'PURCHASE_DOCUMENT_NOT_FOUND',
		});
	}

	const version = store.versions.get(id) ?? 1;
	return delay({ data: cloneDocument(document), headers: { etag: buildEtag(id, version) } });
};

/** `POST /purchase-documents`: 201 borrador, o 422 según sección 6. */
export const createPurchaseDocument = (
	subsidiaryId: number,
	payload: IPurchaseDocumentCreatePayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IPurchaseDocument; headers: { etag: string } }> =>
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'create', payload },
		async () => {
			if (payload.document_type === 'invoice' && payload.supplier_id === null) {
				return fail(
					422,
					buildFieldError(
						'INVOICE_SUPPLIER_REQUIRED',
						PROCUREMENT_ERROR_DEFINITIONS.INVOICE_SUPPLIER_REQUIRED.fallbackMessage,
						'supplier_id',
					),
				);
			}
			if (!payload.document_number?.trim()) {
				return fail(
					422,
					buildFieldError(
						'DOCUMENT_NUMBER_REQUIRED',
						'Indica el folio del documento.',
						'document_number',
					),
				);
			}
			if (!payload.issue_date) {
				return fail(
					422,
					buildFieldError(
						'ISSUE_DATE_REQUIRED',
						'Indica la fecha de emisión.',
						'issue_date',
					),
				);
			}
			if (!Array.isArray(payload.items) || payload.items.length === 0) {
				return fail(422, {
					message: PURCHASE_DOCUMENT_ITEMS_EMPTY_MESSAGE,
					code: 'PURCHASE_DOCUMENT_ITEMS_EMPTY',
				});
			}

			let supplierCompact: ISupplierCompact | null = null;
			if (payload.supplier_id !== null) {
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

			const currencyCode = payload.currency_code || 'CLP';
			const built = buildNewLines(
				subsidiaryId,
				payload.items,
				payload.document_type,
				currencyCode,
			);
			if (built.error) return fail(422, built.error);
			const lines = built.lines!;

			const now = new Date().toISOString();
			const document: IPurchaseDocument = {
				id: nextDocumentIdFor(subsidiaryId),
				document_type: payload.document_type,
				document_number: payload.document_number.trim(),
				issue_date: payload.issue_date,
				currency_code: currencyCode,
				total_amount: payload.total_amount ?? null,
				status: 'draft',
				reception_status: null,
				supplier: supplierCompact,
				items_count: lines.length,
				created_at: now,
				allowed_actions: ['update', 'confirm', 'cancel', 'add_attachment'],
				supplier_snapshot: null,
				notes: payload.notes?.trim() || null,
				items: lines,
				related_counts: { stock_receipts: 0, initial_stock_allocations: 0, attachments: 0 },
				confirmed_at: null,
				cancelled_at: null,
				cancellation_reason: null,
				updated_at: now,
			};

			const store = getStore(subsidiaryId);
			store.documents = [...store.documents, document];
			store.versions.set(document.id, 1);

			return delay({
				data: cloneDocument(document),
				headers: { etag: buildEtag(document.id, 1) },
			});
		},
	);

/**
 * `PATCH /purchase-documents/{document}`: sólo `draft`, exige `If-Match`.
 * Campos ausentes se conservan; `items` presente reemplaza la colección
 * completa (línea con `id` actualiza, sin `id` crea, omitida elimina).
 */
export const updatePurchaseDocument = (
	subsidiaryId: number,
	id: number,
	payload: IPurchaseDocumentUpdatePayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IPurchaseDocument; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'update', id, payload }, () =>
		withDocumentLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.documents.find((document) => document.id === id);
			if (!existing) {
				return fail(404, {
					message: 'El documento de compra no existe.',
					code: 'PURCHASE_DOCUMENT_NOT_FOUND',
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
			if (existing.status !== 'draft') {
				return fail(409, {
					message:
						PROCUREMENT_ERROR_DEFINITIONS.PURCHASE_DOCUMENT_IMMUTABLE.fallbackMessage,
					code: 'PURCHASE_DOCUMENT_IMMUTABLE',
				});
			}

			const documentType = payload.document_type ?? existing.document_type;
			const hasSupplierUpdate = Object.prototype.hasOwnProperty.call(payload, 'supplier_id');
			const nextSupplierId = hasSupplierUpdate
				? payload.supplier_id!
				: (existing.supplier?.id ?? null);

			if (documentType === 'invoice' && nextSupplierId === null) {
				return fail(
					422,
					buildFieldError(
						'INVOICE_SUPPLIER_REQUIRED',
						PROCUREMENT_ERROR_DEFINITIONS.INVOICE_SUPPLIER_REQUIRED.fallbackMessage,
						'supplier_id',
					),
				);
			}

			let supplierCompact = existing.supplier;
			if (hasSupplierUpdate) {
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

			const currencyCode = payload.currency_code ?? existing.currency_code;

			let { items } = existing;
			if (payload.items !== undefined) {
				if (payload.items.length === 0) {
					return fail(422, {
						message: PURCHASE_DOCUMENT_ITEMS_EMPTY_MESSAGE,
						code: 'PURCHASE_DOCUMENT_ITEMS_EMPTY',
					});
				}

				const replaced = replaceExistingLines(
					subsidiaryId,
					existing.items,
					payload.items,
					documentType,
					currencyCode,
				);
				if (replaced.error) return fail(422, replaced.error);
				items = replaced.lines!;
			}

			const updated: IPurchaseDocument = {
				...existing,
				document_type: documentType,
				supplier: supplierCompact,
				document_number: payload.document_number?.trim() ?? existing.document_number,
				issue_date: payload.issue_date ?? existing.issue_date,
				currency_code: currencyCode,
				total_amount: Object.prototype.hasOwnProperty.call(payload, 'total_amount')
					? (payload.total_amount ?? null)
					: existing.total_amount,
				notes: Object.prototype.hasOwnProperty.call(payload, 'notes')
					? payload.notes?.trim() || null
					: existing.notes,
				items,
				items_count: items.length,
				updated_at: new Date().toISOString(),
			};

			store.documents = store.documents.map((document) =>
				document.id === id ? updated : document,
			);
			const nextVersion = bumpVersion(store, id);

			return delay({
				data: cloneDocument(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `POST /purchase-documents/{document}/confirm`: 200 `confirmed`. Fija
 * `supplier_snapshot` y valida la factura (proveedor presente y completo)
 * antes de confirmar — nunca después.
 */
export const confirmPurchaseDocument = (
	subsidiaryId: number,
	id: number,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IPurchaseDocument; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'confirm', id }, () =>
		withDocumentLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.documents.find((document) => document.id === id);
			if (!existing) {
				return fail(404, {
					message: 'El documento de compra no existe.',
					code: 'PURCHASE_DOCUMENT_NOT_FOUND',
				});
			}
			if (existing.status !== 'draft') {
				return fail(409, {
					message: PURCHASE_DOCUMENT_NOT_DRAFT_MESSAGE,
					code: 'PURCHASE_DOCUMENT_NOT_DRAFT',
				});
			}

			let supplierSnapshot: IProcurementSupplier | null = null;
			if (existing.document_type === 'invoice') {
				if (!existing.supplier) {
					return fail(422, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.INVOICE_SUPPLIER_REQUIRED.fallbackMessage,
						code: 'INVOICE_SUPPLIER_REQUIRED',
					});
				}
				const { data: supplier } = await getProcurementSupplier(
					subsidiaryId,
					existing.supplier.id,
				);
				if (!isSupplierCompleteForInvoicing(supplier)) {
					return fail(422, {
						message:
							PROCUREMENT_ERROR_DEFINITIONS.INVOICE_SUPPLIER_INCOMPLETE
								.fallbackMessage,
						code: 'INVOICE_SUPPLIER_INCOMPLETE',
					});
				}
				supplierSnapshot = supplier;
			} else if (existing.supplier) {
				const { data: supplier } = await getProcurementSupplier(
					subsidiaryId,
					existing.supplier.id,
				);
				supplierSnapshot = supplier;
			}

			const updated: IPurchaseDocument = {
				...existing,
				status: 'confirmed',
				// Sin recepciones ni asignaciones todavía: un documento recién
				// confirmado siempre nace `pending`.
				reception_status: 'pending',
				supplier_snapshot: supplierSnapshot,
				confirmed_at: new Date().toISOString(),
				// `create_receipt` (card 05, sección 7 del contrato): un documento
				// confirmado siempre la ofrece, aunque su capacidad restante sea baja
				// — el mock no la oculta por capacidad, la escritura valida y
				// responde `RECEIPT_EXCEEDS_DOCUMENT` si corresponde.
				allowed_actions: ['create_receipt', 'cancel', 'add_attachment'],
				updated_at: new Date().toISOString(),
			};

			store.documents = store.documents.map((document) =>
				document.id === id ? updated : document,
			);
			const nextVersion = bumpVersion(store, id);

			return delay({
				data: cloneDocument(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `POST /purchase-documents/{document}/cancel`: 200 `cancelled`, motivo
 * obligatorio, sólo sin recepciones posted ni asignaciones activas.
 */
export const cancelPurchaseDocument = (
	subsidiaryId: number,
	id: number,
	payload: IPurchaseDocumentCancelPayload,
	headers: IMockWriteHeaders = {},
): Promise<{ data: IPurchaseDocument; headers: { etag: string } }> =>
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'cancel', id, payload }, () =>
		withDocumentLock(subsidiaryId, id, async () => {
			const store = getStore(subsidiaryId);
			const existing = store.documents.find((document) => document.id === id);
			if (!existing) {
				return fail(404, {
					message: 'El documento de compra no existe.',
					code: 'PURCHASE_DOCUMENT_NOT_FOUND',
				});
			}
			if (existing.status === 'cancelled') {
				return fail(409, {
					message: 'El documento ya está anulado.',
					code: 'PURCHASE_DOCUMENT_ALREADY_CANCELLED',
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
			// Hallazgo 9: el bloqueo depende de recepciones `posted` y asignaciones
			// documentales **activas**, no de `related_counts` — ese contador es
			// histórico (sube al dar de alta cualquier recepción, incluso un
			// borrador) y no baja al revertir, a propósito: conserva la historia
			// de anulaciones/reversiones en vez de borrarla para ajustar un
			// número. `received_quantity`/`initial_stock_allocated_quantity` por
			// línea sí reflejan sólo el efecto físico vigente: una reversión los
			// resta exactamente lo que esa recepción había aportado
			// (`applyStockReceiptCoverageDelta`), así que en 0 significa «sin
			// recepciones posted activas para esa línea».
			const hasActivePhysicalEffect = existing.items.some(
				(line) => line.received_quantity > 0 || line.initial_stock_allocated_quantity > 0,
			);
			if (hasActivePhysicalEffect) {
				return fail(409, {
					message: PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS_MESSAGE,
					code: 'PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS',
				});
			}

			const updated: IPurchaseDocument = {
				...existing,
				status: 'cancelled',
				// La cobertura no sobrevive a la anulación (sección 6): un
				// documento anulado no tuvo efecto físico que cubrir.
				reception_status: null,
				cancelled_at: new Date().toISOString(),
				cancellation_reason: payload.reason.trim(),
				allowed_actions: [],
				updated_at: new Date().toISOString(),
			};

			store.documents = store.documents.map((document) =>
				document.id === id ? updated : document,
			);
			const nextVersion = bumpVersion(store, id);

			return delay({
				data: cloneDocument(updated),
				headers: { etag: buildEtag(id, nextVersion) },
			});
		}),
	);

/**
 * `GET .../initial-stock-allocations` (sección 6) ya no vive acá: las
 * asignaciones reales viven en `inventoryStock.service` (el store que las
 * posee, sección 8), que las expone como
 * `listInitialStockAllocationsForPurchaseDocument` — mismo criterio que
 * `GET .../stock-receipts` (hallazgo 9, revisión ZF-110): importarlo desde
 * este archivo crearía el ciclo que ese servicio evita a propósito, porque
 * `inventoryStock.service` sí importa de acá (`findPurchaseDocumentForReceipts`)
 * para resolver el documento y su línea al documentar.
 */

/**
 * Sólo para el servicio de adjuntos (card 04, sección 6): lee el documento
 * vigente sin la latencia artificial del mock ni el envoltorio HTTP. Subir o
 * eliminar un adjunto necesita el `status` del documento para validar la
 * regla de estados («se puede subir en draft y confirmed, nunca cancelled;
 * eliminar sólo en draft»), y duplicar el store de documentos en el servicio
 * de adjuntos rompería la partición por filial que ya mantiene este archivo.
 */
export const findPurchaseDocumentForAttachments = (
	subsidiaryId: number,
	id: number,
): Pick<IPurchaseDocument, 'id' | 'status'> | undefined => {
	const store = getStore(subsidiaryId);
	const document = store.documents.find((item) => item.id === id);
	return document ? { id: document.id, status: document.status } : undefined;
};

/**
 * Refleja en el documento el nuevo total de adjuntos tras subir o eliminar
 * uno (`related_counts.attachments`, sección 6). Bump de versión incluido:
 * `related_counts` es parte de la representación de `IPurchaseDocument`, así
 * que su `ETag` cambia con ella igual que con cualquier otra escritura sobre
 * el documento — una edición de líneas con un `If-Match` tomado antes de
 * subir un adjunto debe recargar, no pisar el conteo nuevo.
 */
export const setPurchaseDocumentAttachmentsCount = (
	subsidiaryId: number,
	id: number,
	count: number,
): void => {
	const store = getStore(subsidiaryId);
	store.documents = store.documents.map((document) =>
		document.id === id
			? { ...document, related_counts: { ...document.related_counts, attachments: count } }
			: document,
	);
	bumpVersion(store, id);
	persistSubsidiaryState(subsidiaryId);
};

/**
 * Sólo para el servicio de recepciones (card 05, sección 7): lee el
 * documento vigente completo, sin la latencia artificial del mock ni el
 * envoltorio HTTP. Dar de alta o publicar una recepción «con documento»
 * necesita el `status` (debe estar `confirmed`) y las líneas (para derivar
 * producto/costo y validar `remaining_quantity`) — mismo criterio que
 * `findPurchaseDocumentForAttachments`, pero con la ficha completa en vez de
 * sólo `id`/`status`.
 */
export const findPurchaseDocumentForReceipts = (
	subsidiaryId: number,
	id: number,
): IPurchaseDocument | undefined => {
	const store = getStore(subsidiaryId);
	const document = store.documents.find((item) => item.id === id);
	return document ? cloneDocument(document) : undefined;
};

/**
 * Sólo para `inventoryStock.service` (card 07, sección 8): el payload de
 * `document-allocations` sólo trae `purchase_document_line_id` — a
 * diferencia de vincular un documento a una recepción (mismo endpoint 1 de
 * la sección 8), acá no viaja `purchase_document_id` — así que resolver el
 * documento exige buscar por línea. El id de línea es único por filial (lo
 * asigna `nextLineIdFor` sobre todos los documentos de la filial, nunca por
 * documento), así que la primera coincidencia es la única posible.
 */
export const findPurchaseDocumentByLineId = (
	subsidiaryId: number,
	lineId: number,
): IPurchaseDocument | undefined => {
	const store = getStore(subsidiaryId);
	const document = store.documents.find((item) => item.items.some((line) => line.id === lineId));
	return document ? cloneDocument(document) : undefined;
};

/**
 * `reception_status` del documento completo (sección 6): `received` cuando
 * ninguna línea tiene saldo pendiente, `pending` cuando ninguna tiene
 * cobertura todavía, `partially_received` en el resto.
 */
const computeReceptionStatus = (
	items: IPurchaseDocumentLine[],
): IPurchaseDocument['reception_status'] => {
	if (items.every((line) => line.remaining_quantity === 0)) return 'received';
	if (items.some((line) => line.accounted_quantity > 0)) return 'partially_received';
	return 'pending';
};

/**
 * Aplica el efecto de publicar o revertir una recepción sobre la cobertura
 * del documento vinculado (sección 6/7): `received_quantity`,
 * `accounted_quantity`, `remaining_quantity` y `received_distribution` por
 * línea, y `reception_status` del documento completo.
 *
 * `quantityDelta` es positivo al publicar (`post`/`retry` exitoso) y
 * negativo al revertir (`reverse`) — una sola función para las dos
 * direcciones evita que publicar y revertir apliquen la aritmética de
 * cobertura de formas distintas y terminen divergiendo.
 *
 * Puramente síncrona a propósito: no hay `await` en el cuerpo, así que no
 * necesita `withDocumentLock` — el single-thread de JS ya la hace atómica
 * frente a cualquier otra escritura de este módulo. Sólo las escrituras que
 * cruzan un `await` (una llamada a `getProcurementSupplier`, por ejemplo)
 * necesitan esa cola.
 */
export const applyStockReceiptCoverageDelta = (
	subsidiaryId: number,
	documentId: number,
	branchId: number,
	warehouse: IWarehouseCompact,
	allocations: { lineId: number; quantityDelta: number }[],
): void => {
	const store = getStore(subsidiaryId);
	const existing = store.documents.find((document) => document.id === documentId);
	if (!existing) return;

	const items = existing.items.map((line) => {
		const allocation = allocations.find((item) => item.lineId === line.id);
		if (!allocation || allocation.quantityDelta === 0) return line;

		const receivedQuantity = line.received_quantity + allocation.quantityDelta;
		const accountedQuantity = receivedQuantity + line.initial_stock_allocated_quantity;
		const distribution = line.received_distribution
			.map((row) =>
				row.branch_id === branchId && row.warehouse?.id === warehouse.id
					? { ...row, quantity: row.quantity + allocation.quantityDelta }
					: row,
			)
			.filter((row) => row.quantity > 0);
		const hasRow = distribution.some(
			(row) => row.branch_id === branchId && row.warehouse?.id === warehouse.id,
		);
		if (!hasRow && allocation.quantityDelta > 0) {
			distribution.push({
				branch_id: branchId,
				warehouse: { ...warehouse },
				quantity: allocation.quantityDelta,
			});
		}

		return {
			...line,
			received_quantity: receivedQuantity,
			accounted_quantity: accountedQuantity,
			remaining_quantity: line.quantity - accountedQuantity,
			received_distribution: distribution,
		};
	});

	const receptionStatus = computeReceptionStatus(items);

	const updated: IPurchaseDocument = {
		...existing,
		items,
		reception_status: receptionStatus,
		updated_at: new Date().toISOString(),
	};
	store.documents = store.documents.map((document) =>
		document.id === documentId ? updated : document,
	);
	bumpVersion(store, documentId);
	persistSubsidiaryState(subsidiaryId);
};

/**
 * Ajusta `related_counts.stock_receipts` al dar de alta (`+1`) o anular
 * (`-1`) una recepción vinculada — mismo criterio de conteo «relacionadas,
 * no sólo posted» que ya usa `related_counts.attachments`. No usa
 * `withDocumentLock`: es una escritura síncrona de un solo campo, igual que
 * `setPurchaseDocumentAttachmentsCount`.
 */
export const bumpPurchaseDocumentStockReceiptsCount = (
	subsidiaryId: number,
	documentId: number,
	delta: number,
): void => {
	const store = getStore(subsidiaryId);
	store.documents = store.documents.map((document) =>
		document.id === documentId
			? {
					...document,
					related_counts: {
						...document.related_counts,
						stock_receipts: Math.max(0, document.related_counts.stock_receipts + delta),
					},
				}
			: document,
	);
	bumpVersion(store, documentId);
	persistSubsidiaryState(subsidiaryId);
};

/**
 * Aplica el efecto de respaldar (o, en teoría, deshacer) una asignación de
 * stock inicial sobre la cobertura del documento vinculado (sección 6/8):
 * mismo criterio exacto que `applyStockReceiptCoverageDelta`, pero suma sobre
 * `initial_stock_allocated_quantity` en vez de `received_quantity` — la
 * cobertura de stock inicial **no** crea recepción ni suma
 * `received_quantity` (sección 6). No hay `received_distribution` que tocar:
 * ese campo es «dónde ingresó físicamente», y una asignación documental no
 * ingresa nada.
 *
 * Síncrona a propósito, igual que `applyStockReceiptCoverageDelta`: no cruza
 * ningún `await`, así que el single-thread de JS ya la hace atómica frente a
 * cualquier otra escritura de este módulo — no necesita `withDocumentLock`.
 */
export const applyInitialStockAllocationCoverageDelta = (
	subsidiaryId: number,
	documentId: number,
	lineId: number,
	quantityDelta: number,
): void => {
	if (quantityDelta === 0) return;

	const store = getStore(subsidiaryId);
	const existing = store.documents.find((document) => document.id === documentId);
	if (!existing) return;

	const items = existing.items.map((line) => {
		if (line.id !== lineId) return line;

		const initialStockAllocatedQuantity = line.initial_stock_allocated_quantity + quantityDelta;
		const accountedQuantity = line.received_quantity + initialStockAllocatedQuantity;
		return {
			...line,
			initial_stock_allocated_quantity: initialStockAllocatedQuantity,
			accounted_quantity: accountedQuantity,
			remaining_quantity: line.quantity - accountedQuantity,
		};
	});

	const receptionStatus = computeReceptionStatus(items);

	const updated: IPurchaseDocument = {
		...existing,
		items,
		reception_status: receptionStatus,
		updated_at: new Date().toISOString(),
	};
	store.documents = store.documents.map((document) =>
		document.id === documentId ? updated : document,
	);
	bumpVersion(store, documentId);
	persistSubsidiaryState(subsidiaryId);
};

/**
 * Ajusta `related_counts.initial_stock_allocations` al respaldar stock
 * inicial (sección 6/8) — mismo criterio exacto que
 * `bumpPurchaseDocumentStockReceiptsCount`: conteo histórico de
 * «relacionadas», no sólo de las vigentes.
 */
export const bumpPurchaseDocumentInitialStockAllocationsCount = (
	subsidiaryId: number,
	documentId: number,
	delta: number,
): void => {
	const store = getStore(subsidiaryId);
	store.documents = store.documents.map((document) =>
		document.id === documentId
			? {
					...document,
					related_counts: {
						...document.related_counts,
						initial_stock_allocations: Math.max(
							0,
							document.related_counts.initial_stock_allocations + delta,
						),
					},
				}
			: document,
	);
	bumpVersion(store, documentId);
	persistSubsidiaryState(subsidiaryId);
};

/**
 * Sólo para pruebas: descarta el estado **en memoria** — como una recarga
 * real de la pestaña — pero conserva lo persistido en `localStorage`
 * (hallazgo 1, igual criterio que `simulateStockReceiptsReloadForTests`).
 */
export const simulatePurchaseDocumentsReloadForTests = (): void => {
	storesBySubsidiary.clear();
	nextDocumentIdBySubsidiary.clear();
	nextLineIdBySubsidiary.clear();
	idempotencyLog.clear();
};

/** Sólo para pruebas: reinicia el store a la semilla de fixtures, incluida la persistencia. */
export const resetPurchaseDocumentsStoreForTests = (): void => {
	simulatePurchaseDocumentsReloadForTests();
	clearAllPersistedMockState(PURCHASE_DOCUMENTS_STORAGE_NAMESPACE);
};
