import { afterEach, describe, expect, it } from 'vitest';
import {
	createInventoryAdjustment,
	createInventoryDocumentAllocation,
	createWarehouseStockMovement,
	getInventoryAdjustableProducts,
	getInventoryOriginFilterOptions,
	getInventoryStockAvailability,
	getInventoryWarehouses,
	listInitialStockAllocationsForPurchaseDocument,
	listInventoryOrigins,
	listInventoryStock,
	resetInventoryStockStoreForTests,
	simulateInventoryStockReloadForTests,
} from '@/services/procurement/inventoryStock.service';
import {
	confirmPurchaseDocument,
	createPurchaseDocument,
	findPurchaseDocumentForReceipts,
	resetPurchaseDocumentsStoreForTests,
} from '@/services/procurement/purchaseDocuments.service';
import { notebookProduct, inventoryStockEnvelope } from '@/mocks/db/procurement.db';
import { inventoryOrigins } from '@/mocks/db/inventoryStock.db';
import type { IInventoryStockListParams } from '@/interface/procurement.interface';

const BRANCH_ID = 4;
const MOUSE_ID = 31;

// IDs literales de `procurement.db.ts`/`inventoryStock.db.ts` (card 07, sección 8).
const SUBSIDIARY_ID = 2; // STOCK_RECEIPT_SUBSIDIARY_ID
const SOUTH_BRANCH_ID = 6; // STOCK_RECEIPT_SOUTH_BRANCH_ID
const CABLE_PRODUCT_ID = 58;
const KEYBOARD_PRODUCT_ID = 67;
const CANONICAL_ORIGIN_ID = 220; // 100 físicos, cableProduct, mainWarehouse, sin documento
const MAIN_WAREHOUSE_ID = 8;
const MIXED_CONDITION_ORIGIN_ID = 54; // keyboardProduct, southBranchWarehouse, fit 5 / unfit 1
const SOUTH_BRANCH_WAREHOUSE_ID = 15;
const CABLE_DOCUMENT_ID = 90; // cableProductInitialStockDocument, confirmado, línea 950, remaining 40
const CABLE_DOCUMENT_LINE_ID = 950;
const KEYBOARD_DOCUMENT_LINE_ID = 601; // pcExpressKeyboardInvoiceDocument (61), confirmado, remaining 12
const DRAFT_DOCUMENT_LINE_ID = 201; // draftReceiptDocument, sin confirmar

const readError = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba rechazo');
	} catch (error) {
		return (error as { response: { status: number; data: { code: string } } }).response;
	}
};

afterEach(() => {
	resetInventoryStockStoreForTests();
	resetPurchaseDocumentsStoreForTests();
});

describe('inventoryStock mock', () => {
	it('mantiene el ejemplo literal sin ubicación y los desgloses independientes', async () => {
		const result = await listInventoryStock(BRANCH_ID, { unlocated: 1 });
		expect(result.context).toEqual({
			scope: 'unlocated',
			branch_id: BRANCH_ID,
			warehouse: null,
		});
		expect(result.data[0]).toMatchObject({
			physical_quantity: 15,
			fit_quantity: 13,
			unfit_quantity: 2,
			documented_quantity: 10,
			undocumented_quantity: 5,
		});
		expect(result.data[0].fit_quantity + result.data[0].unfit_quantity).toBe(
			result.data[0].physical_quantity,
		);
		expect(result.data[0].documented_quantity + result.data[0].undocumented_quantity).toBe(
			result.data[0].physical_quantity,
		);
	});

	it('lista alcances branch y warehouse, busca nombre/SKU, ordena y pagina productos', async () => {
		const branch = await listInventoryStock(BRANCH_ID);
		expect(branch.context.scope).toBe('branch');
		expect(branch.data.every((row) => !row.product.serial_tracking)).toBe(true);
		const warehouse = await listInventoryStock(BRANCH_ID, {
			warehouse_id: 8,
			search: 'test',
			per_page: 15,
		});
		expect(warehouse.context.warehouse?.id).toBe(8);
		expect(warehouse.meta.total).toBeGreaterThan(15);
		expect(warehouse.links.next).not.toBeNull();
		const bySku = await listInventoryStock(BRANCH_ID, { warehouse_id: 8, search: 'KB-001' });
		expect(bySku.data.map((row) => row.product.id)).toContain(67);
	});

	it('rechaza bodega ajena y expone sólo bodegas de la sucursal', async () => {
		expect(getInventoryWarehouses(BRANCH_ID).map((item) => item.id)).toEqual([8, 12]);
		const error = await readError(listInventoryStock(BRANCH_ID, { warehouse_id: 15 }));
		expect(error.status).toBe(422);
		expect(error.data.code).toBe('WAREHOUSE_INVALID');
	});

	it('expande procedencias actuales en FIFO interno sin inventar fecha desconocida', async () => {
		const result = await listInventoryOrigins(BRANCH_ID, MOUSE_ID, { unlocated: 1 });
		expect(result.context.product.id).toBe(MOUSE_ID);
		expect(result.data.map((origin) => origin.origin_id)).toEqual([52, 51]);
		expect(result.data[0].received_on).toBeNull();
		expect(result.data[0].supplier).toBeNull();
		expect(result.data[1]).toMatchObject({
			origin_id: 51,
			stock_receipt_id: 80,
			physical_quantity: 10,
			fit_quantity: 8,
			unfit_quantity: 2,
		});
	});

	it('filtra origins y conserva opciones de documento/proveedor antes de paginar', async () => {
		const options = getInventoryOriginFilterOptions(BRANCH_ID, 67, { warehouse_id: 8 });
		expect(options.suppliers.map((item) => item.id)).toContain(7);
		expect(options.documents.map((item) => item.id)).toContain(24);
		const filtered = await listInventoryOrigins(BRANCH_ID, 67, {
			warehouse_id: 8,
			supplier_id: 7,
		});
		expect(filtered.data).toHaveLength(1);
		expect(filtered.data[0].purchase_document?.id).toBe(24);
	});

	it('cancela la latencia del mock con AbortSignal', async () => {
		const controller = new AbortController();
		const pending = listInventoryStock(BRANCH_ID, {}, controller.signal);
		controller.abort();
		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('agrega ubicaciones por producto antes de paginar y cuenta productos únicos', async () => {
		const result = await listInventoryStock(4, { per_page: 100 });
		expect(new Set(result.data.map((row) => row.product.id)).size).toBe(result.meta.total);
		expect(result.data.find((row) => row.product.id === MOUSE_ID)).toMatchObject({
			physical_quantity: 19,
			fit_quantity: 17,
			unfit_quantity: 2,
			documented_quantity: 14,
			undocumented_quantity: 5,
		});
		const page2 = await listInventoryStock(4, { page: 2 });
		expect(page2.data.map((row) => row.product.id)).toEqual(
			result.data.slice(15).map((row) => row.product.id),
		);
		const outside = await listInventoryStock(4, { page: 999 });
		expect(outside.meta.current_page).toBe(outside.meta.last_page);
	});

	it('cada producto y ubicación cierran contra las cantidades actuales de sus procedencias', async () => {
		const contexts: Array<{ branchId: number; location: IInventoryStockListParams }> = [
			{ branchId: 4, location: {} },
			{ branchId: 4, location: { unlocated: 1 } },
			{ branchId: 4, location: { warehouse_id: 8 } },
			{ branchId: 4, location: { warehouse_id: 12 } },
			{ branchId: 6, location: {} },
		];
		await Promise.all(
			contexts.map(async ({ branchId, location }) => {
				const stock = await listInventoryStock(branchId, { ...location, per_page: 100 });
				await Promise.all(
					stock.data.map(async (row) => {
						const origins = await listInventoryOrigins(branchId, row.product.id, {
							...location,
							per_page: 100,
						});
						expect(
							origins.data.reduce(
								(total, origin) => total + origin.physical_quantity,
								0,
							),
						).toBe(row.physical_quantity);
						expect(
							origins.data.reduce((total, origin) => total + origin.fit_quantity, 0),
						).toBe(row.fit_quantity);
						expect(
							origins.data.reduce(
								(total, origin) => total + origin.unfit_quantity,
								0,
							),
						).toBe(row.unfit_quantity);
						expect(
							origins.data
								.filter((origin) => origin.purchase_document)
								.reduce((total, origin) => total + origin.physical_quantity, 0),
						).toBe(row.documented_quantity);
						expect(row.documented_quantity + row.undocumented_quantity).toBe(
							row.physical_quantity,
						);
					}),
				);
			}),
		);
		const canonical = await listInventoryStock(4, { unlocated: 1 });
		expect(canonical.data).toEqual(inventoryStockEnvelope.data);
	});

	it('rechaza filtros incompatibles también en runtime y excluye realmente un producto serializado', async () => {
		const invalid = { warehouse_id: 8, unlocated: 1 } as unknown as IInventoryStockListParams;
		await expect(listInventoryStock(4, invalid)).rejects.toMatchObject({
			response: { status: 422 },
		});
		await expect(listInventoryOrigins(4, 31, invalid)).rejects.toMatchObject({
			response: { status: 422 },
		});
		await expect(
			listInventoryStock(4, { unlocated: 2 } as unknown as IInventoryStockListParams),
		).rejects.toMatchObject({ response: { status: 422 } });
		expect(inventoryOrigins.some((origin) => origin.product_id === notebookProduct.id)).toBe(
			true,
		);
		const stock = await listInventoryStock(4, { per_page: 100 });
		expect(stock.data.some((row) => row.product.id === notebookProduct.id)).toBe(false);
		await expect(listInventoryOrigins(4, notebookProduct.id)).rejects.toMatchObject({
			response: { status: 404 },
		});
		expect(getInventoryOriginFilterOptions(4, notebookProduct.id, {})).toEqual({
			suppliers: [],
			documents: [],
		});
	});

	it('no replica fixtures en otras sucursales ni permite mutar el catálogo mediante una respuesta', async () => {
		expect((await listInventoryStock(999)).data).toEqual([]);
		const south = await listInventoryStock(6);
		expect(south.data.map((row) => row.product.id)).toEqual([67]);
		const stock = await listInventoryStock(4, { unlocated: 1 });
		stock.data[0].product.name = 'No debe persistir';
		expect((await listInventoryStock(4, { unlocated: 1 })).data[0].product.name).not.toBe(
			'No debe persistir',
		);
	});

	it('paginación FIFO conserva opciones fuera de página y filtra documento/proveedor conjuntamente', async () => {
		const origins = await listInventoryOrigins(4, 67, { warehouse_id: 8 });
		expect(origins.meta.total).toBe(16);
		expect(origins.data).toHaveLength(15);
		expect(origins.data.every((origin) => origin.purchase_document === null)).toBe(true);
		expect(getInventoryOriginFilterOptions(4, 67, { warehouse_id: 8 }).documents).toHaveLength(
			1,
		);
		const filtered = await listInventoryOrigins(4, 67, {
			warehouse_id: 8,
			supplier_id: 7,
			purchase_document_id: 24,
		});
		expect(filtered.data.map((origin) => origin.origin_id)).toEqual([115]);
		expect(
			(await listInventoryOrigins(4, 67, { supplier_id: 7, purchase_document_id: 999 })).data,
		).toEqual([]);
	});

	it('FIFO desempata por origin_id aunque el almacenamiento esté en orden inverso, sin filtrar fifo_at al wire', async () => {
		const first = inventoryOrigins.findIndex((origin) => origin.origin_id === 114);
		const second = inventoryOrigins.findIndex((origin) => origin.origin_id === 115);
		[inventoryOrigins[first], inventoryOrigins[second]] = [
			inventoryOrigins[second],
			inventoryOrigins[first],
		];
		try {
			const result = await listInventoryOrigins(4, 67, { per_page: 100 });
			expect(result.data.slice(-2).map((origin) => origin.origin_id)).toEqual([114, 115]);
			expect(result.data.every((origin) => !('fifo_at' in origin))).toBe(true);
		} finally {
			[inventoryOrigins[first], inventoryOrigins[second]] = [
				inventoryOrigins[second],
				inventoryOrigins[first],
			];
		}
	});
});

/**
 * `POST B/inventory-stock/{product}/document-allocations` (card 07, sección
 * 8, ZF-112): respalda documentalmente stock inicial sin documento.
 * `CANONICAL_ORIGIN_ID` (220, `cableProduct`, `mainWarehouse`) es el caso
 * canónico del issue: 100 físicos sin documento, respaldable contra
 * `CABLE_DOCUMENT_ID` (90, línea 950, capacidad 40).
 */
describe('createInventoryDocumentAllocation', () => {
	it('respaldo parcial: caso canónico 100 físicos = 10 documentados + 90 sin documento, delta físico 0', async () => {
		const { data: allocation } = await createInventoryDocumentAllocation(
			SUBSIDIARY_ID,
			BRANCH_ID,
			CABLE_PRODUCT_ID,
			{
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
				quantity: 10,
				reason: 'Respaldo parcial del conteo inicial',
			},
		);

		expect(allocation.physical_stock_delta).toBe(0);
		expect(allocation.remaining_undocumented_quantity).toBe(90);
		expect(allocation.original_origin_id).toBe(CANONICAL_ORIGIN_ID);
		expect(allocation.quantity).toBe(10);
		expect(allocation.purchase_document.id).toBe(CABLE_DOCUMENT_ID);

		// El caso canónico tiene que quedar legible en una sola pantalla: el
		// stock sigue mostrando 100 físicos, ahora 10 documentados + 90 sin
		// documento — el total no cambia.
		// `per_page: 100`: la bodega principal ya tiene 17 productos distintos
		// sembrados (paginación de otras cards); sin esto, `cableProduct` cae
		// en la página 2 por orden alfabético y el `find` de abajo no lo ve.
		const stock = await listInventoryStock(BRANCH_ID, {
			warehouse_id: MAIN_WAREHOUSE_ID,
			per_page: 100,
		});
		const cableRow = stock.data.find((row) => row.product.id === CABLE_PRODUCT_ID)!;
		expect(cableRow).toMatchObject({
			physical_quantity: 100,
			documented_quantity: 10,
			undocumented_quantity: 90,
		});

		const origins = await listInventoryOrigins(BRANCH_ID, CABLE_PRODUCT_ID, {
			warehouse_id: MAIN_WAREHOUSE_ID,
		});
		expect(origins.data).toHaveLength(2);
		const documented = origins.data.find((origin) => origin.purchase_document !== null)!;
		const undocumented = origins.data.find((origin) => origin.purchase_document === null)!;
		expect(documented.physical_quantity).toBe(10);
		expect(undocumented.physical_quantity).toBe(90);

		// El documento refleja la cobertura como si la asignación hubiese
		// existido desde que se confirmó: no crea recepción ni suma
		// `received_quantity` (sección 6/8).
		const document = findPurchaseDocumentForReceipts(SUBSIDIARY_ID, CABLE_DOCUMENT_ID)!;
		const line = document.items.find((item) => item.id === CABLE_DOCUMENT_LINE_ID)!;
		expect(line.initial_stock_allocated_quantity).toBe(10);
		expect(line.received_quantity).toBe(0);
		expect(line.remaining_quantity).toBe(30);
		expect(document.related_counts.initial_stock_allocations).toBe(1);
	});

	it('respaldo total con condiciones mezcladas: divide fit antes que unfit y el origin sin documento desaparece', async () => {
		const { data: allocation } = await createInventoryDocumentAllocation(
			SUBSIDIARY_ID,
			SOUTH_BRANCH_ID,
			KEYBOARD_PRODUCT_ID,
			{
				origin_id: MIXED_CONDITION_ORIGIN_ID,
				warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID,
				purchase_document_line_id: KEYBOARD_DOCUMENT_LINE_ID,
				quantity: 6,
				reason: 'Respaldo total del conteo inicial',
			},
		);

		expect(allocation.remaining_undocumented_quantity).toBe(0);
		expect(allocation.physical_stock_delta).toBe(0);

		const origins = await listInventoryOrigins(SOUTH_BRANCH_ID, KEYBOARD_PRODUCT_ID, {
			warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID,
		});
		// El origin original (sin documento) se agota por completo: no queda
		// una fila fantasma en saldo cero.
		expect(origins.data.some((origin) => origin.origin_id === MIXED_CONDITION_ORIGIN_ID)).toBe(
			false,
		);
		const documented = origins.data.find((origin) => origin.purchase_document !== null)!;
		// Split determinista fit-antes-de-unfit: 5 fit + 1 unfit, sin
		// reclasificar unidades entre condiciones.
		expect(documented).toMatchObject({
			physical_quantity: 6,
			fit_quantity: 5,
			unfit_quantity: 1,
		});
	});

	it('rechaza cantidad mayor al saldo sin documentar', async () => {
		const response = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
				quantity: 101,
				reason: 'Excede el saldo sin documento',
			}),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('INSUFFICIENT_UNDOCUMENTED_STOCK');
	});

	it('rechaza un origin inexistente en esa ubicación con el mismo código de saldo insuficiente', async () => {
		const response = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: 999999,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
				quantity: 1,
				reason: 'Origin inexistente',
			}),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('INSUFFICIENT_UNDOCUMENTED_STOCK');
	});

	it('rechaza cantidad mayor a la capacidad de la línea del documento', async () => {
		const response = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
				quantity: 50, // cabe en el saldo (100) pero excede la capacidad (40)
				reason: 'Excede la capacidad de la línea',
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('RECEIPT_EXCEEDS_DOCUMENT');
	});

	it('rechaza un documento en draft', async () => {
		const response = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: DRAFT_DOCUMENT_LINE_ID,
				quantity: 1,
				reason: 'Documento sin confirmar',
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('DOCUMENT_NOT_CONFIRMED');
	});

	it('rechaza una línea que no corresponde al producto del origin', async () => {
		const response = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: KEYBOARD_DOCUMENT_LINE_ID,
				quantity: 1,
				reason: 'Línea de otro producto',
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('DOCUMENT_LINE_MISMATCH');
	});

	it('rechaza motivo vacío y cantidad no entera positiva', async () => {
		const missingReason = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
				quantity: 10,
				reason: '   ',
			}),
		);
		expect(missingReason.status).toBe(422);
		expect(missingReason.data.code).toBe('ALLOCATION_REASON_REQUIRED');

		const invalidQuantity = await readError(
			createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
				origin_id: CANONICAL_ORIGIN_ID,
				warehouse_id: MAIN_WAREHOUSE_ID,
				purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
				quantity: 0,
				reason: 'Cantidad inválida',
			}),
		);
		expect(invalidQuantity.status).toBe(422);
		expect(invalidQuantity.data.code).toBe('ALLOCATION_QUANTITY_INVALID');
	});

	it('misma Idempotency-Key repite el resultado; con otro payload responde 409 IDEMPOTENCY_KEY_REUSED', async () => {
		const payload = {
			origin_id: CANONICAL_ORIGIN_ID,
			warehouse_id: MAIN_WAREHOUSE_ID,
			purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
			quantity: 10,
			reason: 'Respaldo parcial',
		};
		const headers = { idempotencyKey: 'idem-allocation-1' };
		const first = await createInventoryDocumentAllocation(
			SUBSIDIARY_ID,
			BRANCH_ID,
			CABLE_PRODUCT_ID,
			payload,
			headers,
		);
		const replay = await createInventoryDocumentAllocation(
			SUBSIDIARY_ID,
			BRANCH_ID,
			CABLE_PRODUCT_ID,
			payload,
			headers,
		);
		expect(replay.data.id).toBe(first.data.id);

		const response = await readError(
			createInventoryDocumentAllocation(
				SUBSIDIARY_ID,
				BRANCH_ID,
				CABLE_PRODUCT_ID,
				{ ...payload, quantity: 5 },
				headers,
			),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('IDEMPOTENCY_KEY_REUSED');
	});

	it('persiste tras «recargar»: no reaparece el origin sin documentar original', async () => {
		await createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
			origin_id: CANONICAL_ORIGIN_ID,
			warehouse_id: MAIN_WAREHOUSE_ID,
			purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
			quantity: 10,
			reason: 'Respaldo parcial',
		});

		simulateInventoryStockReloadForTests();

		const origins = await listInventoryOrigins(BRANCH_ID, CABLE_PRODUCT_ID, {
			warehouse_id: MAIN_WAREHOUSE_ID,
		});
		expect(origins.data.map((origin) => origin.physical_quantity).sort()).toEqual([10, 90]);
	});
});

describe('listInitialStockAllocationsForPurchaseDocument', () => {
	it('lista las asignaciones confirmadas del documento y 404 si el documento no existe', async () => {
		await createInventoryDocumentAllocation(SUBSIDIARY_ID, BRANCH_ID, CABLE_PRODUCT_ID, {
			origin_id: CANONICAL_ORIGIN_ID,
			warehouse_id: MAIN_WAREHOUSE_ID,
			purchase_document_line_id: CABLE_DOCUMENT_LINE_ID,
			quantity: 10,
			reason: 'Respaldo parcial',
		});

		const allocations = await listInitialStockAllocationsForPurchaseDocument(
			SUBSIDIARY_ID,
			CABLE_DOCUMENT_ID,
		);
		expect(allocations.data).toHaveLength(1);
		expect(allocations.data[0]).toMatchObject({ quantity: 10, product_id: CABLE_PRODUCT_ID });
		expect(allocations.meta.total).toBe(1);

		const missing = await readError(
			listInitialStockAllocationsForPurchaseDocument(SUBSIDIARY_ID, 9999),
		);
		expect(missing.status).toBe(404);
	});

	it('paginan vacías para un documento sin asignaciones todavía', async () => {
		const document = await createPurchaseDocument(SUBSIDIARY_ID, {
			document_type: 'receipt',
			supplier_id: null,
			document_number: `TEST-ALLOC-${Math.random().toString(36).slice(2, 8)}`,
			issue_date: '2026-09-08',
			currency_code: 'CLP',
			total_amount: null,
			notes: null,
			items: [
				{
					product_id: CABLE_PRODUCT_ID,
					quantity: 5,
					unit_cost: '1000.00',
					unit_cost_basis: 'net',
					notes: null,
				},
			],
		});
		const { data: confirmed } = await confirmPurchaseDocument(SUBSIDIARY_ID, document.data.id);

		const allocations = await listInitialStockAllocationsForPurchaseDocument(
			SUBSIDIARY_ID,
			confirmed.id,
		);
		expect(allocations.data).toEqual([]);
		expect(allocations.meta.total).toBe(0);
	});
});

/* =================================================
   Traslados internos y ajuste por conteo — card 08 (ZF-113), secciones 9 y 11
   ================================================= */

/** Físico, apto y no apto de un producto en una ubicación, leídos por el mismo endpoint que la UI. */
const balanceAt = async (
	productId: number,
	location: IInventoryStockListParams,
	branchId = BRANCH_ID,
) => {
	// `per_page` explícito: el defecto del contrato es 15 y los fixtures de
	// demostración empujan cable y mouse fuera de la primera página.
	const stock = await listInventoryStock(branchId, { ...location, per_page: 100 });
	const row = stock.data.find((candidate) => candidate.product.id === productId);
	return {
		physical: row?.physical_quantity ?? 0,
		fit: row?.fit_quantity ?? 0,
		unfit: row?.unfit_quantity ?? 0,
		documented: row?.documented_quantity ?? 0,
		undocumented: row?.undocumented_quantity ?? 0,
	};
};

/** Invariantes que `procurement.db.test.ts` exige a cualquier fila de stock. */
const expectStockInvariants = async (productId: number, location: IInventoryStockListParams) => {
	const totals = await balanceAt(productId, location);
	expect(totals.fit + totals.unfit).toBe(totals.physical);
	expect(totals.documented + totals.undocumented).toBe(totals.physical);
};

describe('createWarehouseStockMovement', () => {
	it('mueve aptos entre Sin ubicación y una bodega, con neto cero y unidades contadas una vez', async () => {
		const before = await balanceAt(MOUSE_ID, {});

		const { data } = await createWarehouseStockMovement(BRANCH_ID, {
			from_warehouse_id: null,
			to_warehouse_id: MAIN_WAREHOUSE_ID,
			reason: 'Ubicar productos del conteo inicial',
			items: [{ product_id: MOUSE_ID, quantity: 5, condition: 'fit' }],
		});

		expect(data.operation_type).toBe('warehouse_stock_placement');
		expect(data.global_stock_delta).toBe(0);
		expect(data.items).toHaveLength(1);
		// El criterio de aceptación: 5 unidades se leen como 5, nunca como 10.
		expect(data.items.reduce((total, item) => total + item.quantity, 0)).toBe(5);

		const unlocated = await balanceAt(MOUSE_ID, { unlocated: 1 });
		const warehouse = await balanceAt(MOUSE_ID, { warehouse_id: MAIN_WAREHOUSE_ID });
		expect(data.items[0].origin_quantity_after).toBe(unlocated.fit);
		expect(data.items[0].destination_quantity_after).toBe(warehouse.fit);

		// El total de la sucursal no cambió: sólo cambió dónde están las unidades.
		const after = await balanceAt(MOUSE_ID, {});
		expect(after).toEqual(before);
		await expectStockInvariants(MOUSE_ID, {});
	});

	it('mueve no aptos sin tocar los aptos: no hay conversión entre condiciones', async () => {
		const before = await balanceAt(
			KEYBOARD_PRODUCT_ID,
			{ warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID },
			SOUTH_BRANCH_ID,
		);
		expect(before.unfit).toBeGreaterThan(0);

		const { data } = await createWarehouseStockMovement(SOUTH_BRANCH_ID, {
			from_warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID,
			to_warehouse_id: null,
			reason: 'Retirar no aptos de la bodega',
			items: [{ product_id: KEYBOARD_PRODUCT_ID, quantity: 1, condition: 'unfit' }],
		});

		const origin = await balanceAt(
			KEYBOARD_PRODUCT_ID,
			{ warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID },
			SOUTH_BRANCH_ID,
		);
		const destination = await balanceAt(KEYBOARD_PRODUCT_ID, { unlocated: 1 }, SOUTH_BRANCH_ID);
		expect(origin.fit).toBe(before.fit);
		expect(origin.unfit).toBe(before.unfit - 1);
		expect(destination.unfit).toBe(1);
		expect(destination.fit).toBe(0);
		expect(data.items[0].origin_quantity_after).toBe(origin.unfit);
		expect(data.items[0].destination_quantity_after).toBe(destination.unfit);
	});

	it('conserva la procedencia y el orden FIFO en el destino', async () => {
		await createWarehouseStockMovement(BRANCH_ID, {
			from_warehouse_id: null,
			to_warehouse_id: MAIN_WAREHOUSE_ID,
			reason: 'Ubicar stock documentado',
			// El origin 51 (documentado, fifo_at 2) va antes que el 52 (sin
			// documento, fifo_at 1)… al revés: 52 es más viejo y sale primero.
			items: [{ product_id: MOUSE_ID, quantity: 6, condition: 'fit' }],
		});

		const origins = await listInventoryOrigins(BRANCH_ID, MOUSE_ID, {
			warehouse_id: MAIN_WAREHOUSE_ID,
		});
		// Se consumió primero el origin sin documento (fifo_at menor) y luego el
		// documentado: ambas procedencias llegan enteras, ninguna se mezcla.
		const undocumented = origins.data.filter((origin) => origin.purchase_document === null);
		const documented = origins.data.filter((origin) => origin.purchase_document !== null);
		expect(undocumented.reduce((total, origin) => total + origin.physical_quantity, 0)).toBe(5);
		expect(documented.reduce((total, origin) => total + origin.physical_quantity, 0)).toBe(1);
		expect(documented[0].supplier).not.toBeNull();
		expect(documented[0].stock_receipt_id).toBe(80);
	});

	it('fusiona en el destino en vez de multiplicar filas al mover ida y vuelta', async () => {
		const move = (from: number | null, to: number | null) =>
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: from,
				to_warehouse_id: to,
				reason: 'Reubicar',
				items: [{ product_id: MOUSE_ID, quantity: 3, condition: 'fit' }],
			});

		const originalRows = (await listInventoryOrigins(BRANCH_ID, MOUSE_ID, { unlocated: 1 }))
			.meta.total;
		await move(null, MAIN_WAREHOUSE_ID);
		await move(MAIN_WAREHOUSE_ID, null);
		await move(null, MAIN_WAREHOUSE_ID);
		await move(MAIN_WAREHOUSE_ID, null);

		const rows = await listInventoryOrigins(BRANCH_ID, MOUSE_ID, { unlocated: 1 });
		expect(rows.meta.total).toBe(originalRows);
		await expectStockInvariants(MOUSE_ID, { unlocated: 1 });
	});

	it('rechaza saldo insuficiente en la condición pedida', async () => {
		const response = await readError(
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: null,
				to_warehouse_id: MAIN_WAREHOUSE_ID,
				reason: 'Mover más de lo que hay',
				items: [{ product_id: MOUSE_ID, quantity: 999, condition: 'fit' }],
			}),
		);
		expect(response.status).toBe(409);
		expect(response.data.code).toBe('INSUFFICIENT_LOCATION_STOCK');
	});

	it('rechaza una bodega de otra sucursal como destino', async () => {
		const response = await readError(
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: null,
				to_warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID,
				reason: 'Mover a otra sucursal',
				items: [{ product_id: MOUSE_ID, quantity: 1, condition: 'fit' }],
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('WAREHOUSE_INVALID');
	});

	it('rechaza origen igual a destino, motivo vacío y cantidad no positiva', async () => {
		const same = await readError(
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: null,
				to_warehouse_id: null,
				reason: 'Mover a la misma ubicación',
				items: [{ product_id: MOUSE_ID, quantity: 1, condition: 'fit' }],
			}),
		);
		expect(same.data.code).toBe('MOVEMENT_SAME_LOCATION');

		const noReason = await readError(
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: null,
				to_warehouse_id: MAIN_WAREHOUSE_ID,
				reason: '   ',
				items: [{ product_id: MOUSE_ID, quantity: 1, condition: 'fit' }],
			}),
		);
		expect(noReason.data.code).toBe('MOVEMENT_REASON_REQUIRED');

		const badQuantity = await readError(
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: null,
				to_warehouse_id: MAIN_WAREHOUSE_ID,
				reason: 'Cantidad inválida',
				items: [{ product_id: MOUSE_ID, quantity: 0, condition: 'fit' }],
			}),
		);
		expect(badQuantity.data.code).toBe('MOVEMENT_QUANTITY_INVALID');
	});

	it('no aplica ninguna línea cuando una sola falta de saldo', async () => {
		const before = await balanceAt(MOUSE_ID, { unlocated: 1 });
		await readError(
			createWarehouseStockMovement(BRANCH_ID, {
				from_warehouse_id: null,
				to_warehouse_id: MAIN_WAREHOUSE_ID,
				reason: 'Traslado atómico',
				items: [
					{ product_id: MOUSE_ID, quantity: 1, condition: 'fit' },
					{ product_id: MOUSE_ID, quantity: 999, condition: 'unfit' },
				],
			}),
		);
		expect(await balanceAt(MOUSE_ID, { unlocated: 1 })).toEqual(before);
	});

	it('replica la respuesta con la misma clave y rechaza reusarla con otro payload', async () => {
		const payload = {
			from_warehouse_id: null,
			to_warehouse_id: MAIN_WAREHOUSE_ID,
			reason: 'Ubicar',
			items: [{ product_id: MOUSE_ID, quantity: 2, condition: 'fit' as const }],
		};
		const first = await createWarehouseStockMovement(BRANCH_ID, payload, {
			idempotencyKey: 'key-traslado',
		});
		const replay = await createWarehouseStockMovement(BRANCH_ID, payload, {
			idempotencyKey: 'key-traslado',
		});
		expect(replay.data.id).toBe(first.data.id);
		// La réplica no volvió a mover: el saldo refleja un solo traslado.
		const warehouse = await balanceAt(MOUSE_ID, { warehouse_id: MAIN_WAREHOUSE_ID });
		expect(warehouse.fit).toBe(2);

		const reused = await readError(
			createWarehouseStockMovement(
				BRANCH_ID,
				{ ...payload, items: [{ ...payload.items[0], quantity: 3 }] },
				{ idempotencyKey: 'key-traslado' },
			),
		);
		expect(reused.status).toBe(409);
		expect(reused.data.code).toBe('IDEMPOTENCY_KEY_REUSED');
	});
});

describe('createInventoryAdjustment', () => {
	const baseAdjustment = {
		warehouse_id: MAIN_WAREHOUSE_ID as number | null,
		reason: 'Conteo físico',
		notes: null,
		related_stock_receipt_id: null as number | null,
	};

	it('aplica un egreso FIFO y devuelve antes/después de físico, apto y no apto', async () => {
		const before = await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID });

		const { data } = await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			reason: 'Conteo físico: faltan dos unidades',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -2, condition: 'fit' }],
		});

		expect(data.operation_type).toBe('inventory_adjustment');
		expect(data.items[0]).toMatchObject({
			physical_quantity_before: before.physical,
			physical_quantity_after: before.physical - 2,
			fit_quantity_before: before.fit,
			fit_quantity_after: before.fit - 2,
			unfit_quantity_before: before.unfit,
			unfit_quantity_after: before.unfit,
		});
		await expectStockInvariants(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID });
	});

	it('crea un origen desconocido de ajuste en un ingreso positivo', async () => {
		await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			reason: 'Conteo físico: sobran tres unidades',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: 3, condition: 'fit' }],
		});

		const origins = await listInventoryOrigins(BRANCH_ID, CABLE_PRODUCT_ID, {
			warehouse_id: MAIN_WAREHOUSE_ID,
		});
		const adjustmentOrigin = origins.data.find(
			(origin) => origin.origin_type === 'inventory_adjustment',
		);
		expect(adjustmentOrigin).toBeDefined();
		expect(adjustmentOrigin).toMatchObject({
			stock_receipt_id: null,
			received_on: null,
			supplier: null,
			purchase_document: null,
			physical_quantity: 3,
			fit_quantity: 3,
			unfit_quantity: 0,
		});
		// El ingreso entra al final de la cola FIFO: no se adelanta al stock viejo.
		expect(origins.data[origins.data.length - 1].origin_id).toBe(adjustmentOrigin?.origin_id);
	});

	it('exige un origen de la recepción enlazada en los egresos', async () => {
		const missing = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				warehouse_id: null,
				related_stock_receipt_id: 80,
				reason: 'Corrección enlazada',
				items: [{ product_id: MOUSE_ID, quantity_delta: -1, condition: 'fit' }],
			}),
		);
		expect(missing.status).toBe(422);
		expect(missing.data.code).toBe('ADJUSTMENT_ORIGIN_REQUIRED');

		const { data } = await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			warehouse_id: null,
			related_stock_receipt_id: 80,
			reason: 'Corrección enlazada',
			items: [{ product_id: MOUSE_ID, quantity_delta: -1, condition: 'fit', origin_id: 51 }],
		});
		expect(data.related_stock_receipt_id).toBe(80);
		expect(data.items[0].fit_quantity_after).toBe(data.items[0].fit_quantity_before - 1);
	});

	it('rechaza un origen que no pertenece a la recepción enlazada', async () => {
		const response = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				warehouse_id: null,
				related_stock_receipt_id: 80,
				reason: 'Origen ajeno',
				// El origin 52 es stock inicial sin recepción.
				items: [
					{ product_id: MOUSE_ID, quantity_delta: -1, condition: 'fit', origin_id: 52 },
				],
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('ADJUSTMENT_ORIGIN_MISMATCH');
	});

	it('no permite atribuir un ingreso positivo a un origen viejo', async () => {
		const response = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				warehouse_id: null,
				reason: 'Ingreso atribuido',
				items: [
					{ product_id: MOUSE_ID, quantity_delta: 2, condition: 'fit', origin_id: 51 },
				],
			}),
		);
		expect(response.status).toBe(422);
		expect(response.data.code).toBe('ADJUSTMENT_ORIGIN_NOT_ALLOWED');
	});

	it('rechaza delta cero, motivo vacío y egreso bajo cero', async () => {
		const zero = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: 0, condition: 'fit' }],
			}),
		);
		expect(zero.data.code).toBe('ADJUSTMENT_QUANTITY_DELTA_INVALID');

		const noReason = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				reason: '  ',
				items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -1, condition: 'fit' }],
			}),
		);
		expect(noReason.data.code).toBe('ADJUSTMENT_REASON_REQUIRED');

		const belowZero = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -9999, condition: 'fit' }],
			}),
		);
		expect(belowZero.status).toBe(409);
		expect(belowZero.data.code).toBe('INSUFFICIENT_LOCATION_STOCK');
	});

	it('rechaza una bodega de otra sucursal y una recepción sin stock acá', async () => {
		const foreign = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				warehouse_id: SOUTH_BRANCH_WAREHOUSE_ID,
				items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -1, condition: 'fit' }],
			}),
		);
		expect(foreign.data.code).toBe('WAREHOUSE_INVALID');

		const unknownReceipt = await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				related_stock_receipt_id: 99999,
				items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -1, condition: 'fit' }],
			}),
		);
		expect(unknownReceipt.data.code).toBe('ADJUSTMENT_RECEIPT_NOT_FOUND');
	});

	it('no aplica ninguna línea cuando una sola falta de saldo', async () => {
		const before = await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID });
		await readError(
			createInventoryAdjustment(BRANCH_ID, {
				...baseAdjustment,
				items: [
					{ product_id: CABLE_PRODUCT_ID, quantity_delta: -1, condition: 'fit' },
					{ product_id: CABLE_PRODUCT_ID, quantity_delta: -50, condition: 'unfit' },
				],
			}),
		);
		expect(await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID })).toEqual(
			before,
		);
	});

	it('trata la recepción omitida igual que una recepción nula: egreso general por FIFO', async () => {
		const omitted = await createInventoryAdjustment(BRANCH_ID, {
			warehouse_id: MAIN_WAREHOUSE_ID,
			reason: 'Conteo físico',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -2, condition: 'fit' }],
		});
		const afterOmitted = await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID });

		resetInventoryStockStoreForTests();

		const explicit = await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			related_stock_receipt_id: null,
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -2, condition: 'fit' }],
		});

		expect(omitted.data.related_stock_receipt_id).toBeNull();
		expect(omitted.data.items).toEqual(explicit.data.items);
		expect(await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID })).toEqual(
			afterOmitted,
		);
	});

	it('vuelve a subir un producto cuyo saldo llegó a cero, con ubicación y sin ella', async () => {
		const start = await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID });

		await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			reason: 'Conteo físico: no queda ninguno',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -start.fit, condition: 'fit' }],
		});
		expect((await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID })).physical) //
			.toBe(0);

		// El catálogo lo sigue ofreciendo: un conteo en cero es corregible al alza.
		expect(
			getInventoryAdjustableProducts().some(
				(product) => product.id === CABLE_PRODUCT_ID && !product.serial_tracking,
			),
		).toBe(true);

		await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			reason: 'Conteo físico: aparecen tres',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: 3, condition: 'fit' }],
		});
		expect(
			await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID }),
		).toMatchObject({ physical: 3, fit: 3, unfit: 0 });

		// «Sin ubicación» es una ubicación como cualquier otra, también en cero.
		expect((await balanceAt(CABLE_PRODUCT_ID, { unlocated: 1 })).physical).toBe(0);
		await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			warehouse_id: null,
			reason: 'Conteo físico: aparecen dos sin ubicar',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: 2, condition: 'fit' }],
		});
		expect(await balanceAt(CABLE_PRODUCT_ID, { unlocated: 1 })).toMatchObject({
			physical: 2,
			fit: 2,
		});
		await expectStockInvariants(CABLE_PRODUCT_ID, { unlocated: 1 });
	});

	it('deja ver el faltante cuando el conteo baja del disponible reservado, sin truncarlo en cero', async () => {
		const before = getInventoryStockAvailability(BRANCH_ID, MOUSE_ID);
		// El fixture reserva 16 de los 17 aptos de la sucursal: queda 1 disponible.
		expect(before).toMatchObject({ fit_quantity: 17, reserved_quantity: 16 });
		expect(before.available_quantity).toBe(1);

		await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			warehouse_id: null,
			reason: 'Conteo físico: faltan tres',
			items: [{ product_id: MOUSE_ID, quantity_delta: -3, condition: 'fit' }],
		});

		const after = getInventoryStockAvailability(BRANCH_ID, MOUSE_ID);
		// El ajuste corrige el físico y no libera compromisos: la reserva sigue.
		expect(after.reserved_quantity).toBe(before.reserved_quantity);
		expect(after.fit_quantity).toBe(before.fit_quantity - 3);
		// Lo que la card exige poder mostrar: negativo, no truncado en cero.
		expect(after.available_quantity).toBe(-2);
	});

	it('persiste el resultado entre recargas de la pestaña', async () => {
		await createInventoryAdjustment(BRANCH_ID, {
			...baseAdjustment,
			reason: 'Conteo físico',
			items: [{ product_id: CABLE_PRODUCT_ID, quantity_delta: -4, condition: 'fit' }],
		});
		const afterWrite = await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID });

		simulateInventoryStockReloadForTests();

		expect(await balanceAt(CABLE_PRODUCT_ID, { warehouse_id: MAIN_WAREHOUSE_ID })).toEqual(
			afterWrite,
		);
	});
});
