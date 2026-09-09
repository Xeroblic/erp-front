import { describe, expect, it } from 'vitest';
import {
	getInventoryOriginFilterOptions,
	getInventoryWarehouses,
	listInventoryOrigins,
	listInventoryStock,
} from '@/services/procurement/inventoryStock.service';
import { notebookProduct, inventoryStockEnvelope } from '@/mocks/db/procurement.db';
import { inventoryOrigins } from '@/mocks/db/inventoryStock.db';
import type { IInventoryStockListParams } from '@/interface/procurement.interface';

const BRANCH_ID = 4;
const MOUSE_ID = 31;

const readError = async (promise: Promise<unknown>) => {
	try {
		await promise;
		throw new Error('Se esperaba rechazo');
	} catch (error) {
		return (error as { response: { status: number; data: { code: string } } }).response;
	}
};

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
