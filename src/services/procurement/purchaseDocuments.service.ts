import {
	purchaseDocuments as documentSeed,
	purchasableProcurementProducts,
} from '@/mocks/db/procurement.db';
import { getProcurementSupplier } from '@/services/procurement/procurementSuppliers.service';
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
	IApiPaginationMeta,
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

const getStore = (subsidiaryId: number): IPurchaseDocumentVersionedStore => {
	let store = storesBySubsidiary.get(subsidiaryId);
	if (store === undefined) {
		store = seedStore();
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

const idempotencyLog = new Map<string, { payloadHash: string; result: unknown }>();
const idempotencyLogKey = (subsidiaryId: number, key: string): string => `${subsidiaryId}:${key}`;

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

async function withIdempotency<T>(
	subsidiaryId: number,
	idempotencyKey: string | undefined,
	payloadForHash: unknown,
	run: () => Promise<T>,
): Promise<T> {
	if (!idempotencyKey) return run();

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
		return logged.result as T;
	}

	const result = await run();
	idempotencyLog.set(logKey, { payloadHash, result });
	return result;
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
				allowed_actions: ['update', 'confirm', 'cancel'],
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
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'update', id, payload },
		async () => {
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
		},
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
	withIdempotency(subsidiaryId, headers.idempotencyKey, { action: 'confirm', id }, async () => {
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
						PROCUREMENT_ERROR_DEFINITIONS.INVOICE_SUPPLIER_INCOMPLETE.fallbackMessage,
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
			// Sin recepciones ni asignaciones todavía (cards 04/05): un documento
			// recién confirmado siempre nace `pending`.
			reception_status: 'pending',
			supplier_snapshot: supplierSnapshot,
			confirmed_at: new Date().toISOString(),
			// `create_receipt` y `add_attachment` se omiten a propósito: las
			// cards 04 y 05 todavía no existen para ofrecerlas de verdad.
			allowed_actions: ['cancel'],
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
	});

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
	withIdempotency(
		subsidiaryId,
		headers.idempotencyKey,
		{ action: 'cancel', id, payload },
		async () => {
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
			if (
				existing.related_counts.stock_receipts > 0 ||
				existing.related_counts.initial_stock_allocations > 0
			) {
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
		},
	);

const emptyRelatedListEnvelope = (
	subsidiaryId: number,
	documentId: number,
	path: string,
	params: { page?: number; per_page?: number },
): IApiCollectionEnvelope<never> => {
	const { page, per_page: perPage } = normalizePageParams(params);
	const meta: IApiPaginationMeta = {
		current_page: page,
		from: null,
		last_page: 1,
		links: [],
		path: `/api/subsidiaries/${subsidiaryId}/procurement/purchase-documents/${documentId}/${path}`,
		per_page: perPage,
		to: null,
		total: 0,
	};
	return {
		data: [],
		links: { first: '?page=1', last: '?page=1', prev: null, next: null },
		meta,
	};
};

/**
 * `GET .../stock-receipts` y `GET .../initial-stock-allocations` (sección 6):
 * listas relacionadas paginadas, nunca incrustadas en el detalle. Siempre
 * vacías en este mock — nada las puebla todavía, porque recibir mercadería
 * (card 05) y documentar stock inicial (card 04/08) no existen— pero
 * paginan de verdad: el día que ese contrato exista, sólo el servicio cambia.
 */
export const listPurchaseDocumentStockReceipts = async (
	subsidiaryId: number,
	documentId: number,
	params: { page?: number; per_page?: number } = {},
): Promise<IApiCollectionEnvelope<never>> => {
	const store = getStore(subsidiaryId);
	if (!store.documents.some((document) => document.id === documentId)) {
		return fail(404, {
			message: 'El documento de compra no existe.',
			code: 'PURCHASE_DOCUMENT_NOT_FOUND',
		});
	}
	return delay(emptyRelatedListEnvelope(subsidiaryId, documentId, 'stock-receipts', params));
};

export const listPurchaseDocumentInitialStockAllocations = async (
	subsidiaryId: number,
	documentId: number,
	params: { page?: number; per_page?: number } = {},
): Promise<IApiCollectionEnvelope<never>> => {
	const store = getStore(subsidiaryId);
	if (!store.documents.some((document) => document.id === documentId)) {
		return fail(404, {
			message: 'El documento de compra no existe.',
			code: 'PURCHASE_DOCUMENT_NOT_FOUND',
		});
	}
	return delay(
		emptyRelatedListEnvelope(subsidiaryId, documentId, 'initial-stock-allocations', params),
	);
};

/** Sólo para pruebas: reinicia el store en memoria a la semilla de fixtures. */
export const resetPurchaseDocumentsStoreForTests = (): void => {
	storesBySubsidiary.clear();
	nextDocumentIdBySubsidiary.clear();
	nextLineIdBySubsidiary.clear();
	idempotencyLog.clear();
};
