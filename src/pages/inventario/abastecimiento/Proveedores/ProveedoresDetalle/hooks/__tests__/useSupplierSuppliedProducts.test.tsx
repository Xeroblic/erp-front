import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	grossEnteredCost,
	keyboardProduct,
	mouseProduct,
	netEnteredCost,
	postedKeyboardStockReceipt,
} from '@/mocks/db/procurement.db';
import { getStockReceipt, listStockReceipts } from '@/services/procurement/stockReceipts.service';
import type {
	IApiCollectionEnvelope,
	IProcurementProduct,
	IStockReceipt,
	IStockReceiptItem,
	IStockReceiptListRow,
} from '@/interface/procurement.interface';
import useSupplierSuppliedProducts, {
	aggregateSuppliedProducts,
} from '../useSupplierSuppliedProducts';

/**
 * El servicio se mockea: el store real de recepciones agenda un worker que
 * publica las `queued` sembradas a los 900 ms, y eso volvería no determinista
 * cualquier aserción sobre qué recepciones están `posted`.
 */

const authorizeMock = vi.fn<(options?: { permission?: string }) => boolean>();

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: authorizeMock, isLoading: false }),
}));
// Las recepciones siguen siendo mock: el hook sólo las pide con la bandera encendida.
const mockFlag = vi.hoisted(() => ({ enabled: true }));
vi.mock('@/config/inventoryStock.config', () => ({
	get default() {
		return mockFlag.enabled;
	},
}));
vi.mock('@/services/procurement/stockReceipts.service', () => ({
	listStockReceipts: vi.fn(),
	getStockReceipt: vi.fn(),
}));

const listMock = vi.mocked(listStockReceipts);
const detailMock = vi.mocked(getStockReceipt);

const line = (
	id: number,
	product: IProcurementProduct,
	quantity: number,
	cost = netEnteredCost,
): IStockReceiptItem => ({
	id,
	product,
	sku_snapshot: product.sku,
	name_snapshot: product.name,
	purchase_document_line_id: null,
	quantity,
	cost,
});

/** Recepción más reciente que la sembrada: dos líneas de teclado y una de mouse. */
const newerReceipt: IStockReceipt = {
	...postedKeyboardStockReceipt,
	id: 95,
	received_on: '2026-09-05',
	purchase_document: null,
	items_count: 3,
	total_quantity: 6,
	items: [
		line(1, keyboardProduct, 3, netEnteredCost),
		line(2, keyboardProduct, 2, grossEnteredCost),
		line(3, mouseProduct, 1, grossEnteredCost),
	],
};

/** Revertida y la más nueva de todas: si participara, sería la «última compra». */
const reversedReceipt: IStockReceipt = {
	...postedKeyboardStockReceipt,
	id: 99,
	status: 'reversed',
	received_on: '2026-09-10',
};

const envelope = (rows: IStockReceiptListRow[]): IApiCollectionEnvelope<IStockReceiptListRow> => ({
	data: rows,
	links: { first: '?page=1', last: '?page=1', prev: null, next: null },
	meta: {
		current_page: 1,
		from: rows.length === 0 ? null : 1,
		last_page: 1,
		links: [],
		path: '/api/subsidiaries/2/procurement/stock-receipts',
		per_page: 100,
		to: rows.length === 0 ? null : rows.length,
		total: rows.length,
	},
});

const detailOf = (receipt: IStockReceipt) => ({ data: receipt, headers: { etag: 'W/"test"' } });

describe('aggregateSuppliedProducts', () => {
	it('agrupa por producto con la última compra por received_on DESC y excluye revertidas', () => {
		const rows = aggregateSuppliedProducts([
			postedKeyboardStockReceipt,
			reversedReceipt,
			newerReceipt,
		]);

		expect(rows.map((row) => row.product.id)).toEqual([keyboardProduct.id, mouseProduct.id]);

		const keyboard = rows[0];
		expect(keyboard.receipt_count).toBe(2);
		expect(keyboard.total_units_received).toBe(8 + 3 + 2);
		expect(keyboard.last_purchase).toMatchObject({
			stock_receipt_id: newerReceipt.id,
			received_on: '2026-09-05',
			quantity: 5,
		});
	});

	it('no promedia costos: varias líneas del producto en la recepción dejan cost en null', () => {
		const [keyboard, mouse] = aggregateSuppliedProducts([newerReceipt]);

		expect(keyboard.last_purchase.cost).toBeNull();
		expect(mouse.last_purchase.cost).toEqual(grossEnteredCost);
	});
});

describe('useSupplierSuppliedProducts', () => {
	beforeEach(() => {
		authorizeMock.mockReset();
		listMock.mockReset();
		detailMock.mockReset();
		mockFlag.enabled = true;
	});

	it('sin la bandera de datos simulados no consulta recepciones aunque tenga permiso', () => {
		mockFlag.enabled = false;
		authorizeMock.mockReturnValue(true);

		const { result } = renderHook(() =>
			useSupplierSuppliedProducts({ subsidiaryId: 2, supplierId: 7 }),
		);

		expect(result.current.available).toBe(false);
		expect(result.current.loading).toBe(false);
		expect(listMock).not.toHaveBeenCalled();
	});

	it('sin view-product no consulta recepciones', () => {
		authorizeMock.mockReturnValue(false);

		const { result } = renderHook(() =>
			useSupplierSuppliedProducts({ subsidiaryId: 2, supplierId: 7 }),
		);

		expect(result.current.canRead).toBe(false);
		expect(result.current.loading).toBe(false);
		expect(listMock).not.toHaveBeenCalled();
		expect(authorizeMock).toHaveBeenCalledWith(
			expect.objectContaining({ permission: 'view-product', subsidiaryId: 2 }),
		);
	});

	it('pide sólo recepciones posted del proveedor y agrega su detalle', async () => {
		authorizeMock.mockReturnValue(true);
		listMock.mockResolvedValue(envelope([postedKeyboardStockReceipt, newerReceipt]));
		detailMock.mockImplementation((_subsidiaryId, id) =>
			Promise.resolve(
				detailOf(id === newerReceipt.id ? newerReceipt : postedKeyboardStockReceipt),
			),
		);

		const { result } = renderHook(() =>
			useSupplierSuppliedProducts({ subsidiaryId: 2, supplierId: 7 }),
		);

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(listMock).toHaveBeenCalledWith(
			2,
			expect.objectContaining({ supplier_id: 7, status: 'posted' }),
		);
		expect(detailMock).toHaveBeenCalledTimes(2);
		expect(result.current.rows.map((row) => row.product.id)).toEqual([
			keyboardProduct.id,
			mouseProduct.id,
		]);
		expect(result.current.error).toBeNull();
	});

	it('una respuesta tardía del proveedor anterior no pisa al actual', async () => {
		authorizeMock.mockReturnValue(true);
		let resolveFirstSupplier: (
			value: IApiCollectionEnvelope<IStockReceiptListRow>,
		) => void = () => undefined;
		listMock.mockImplementation((_subsidiaryId, params) =>
			params?.supplier_id === 7
				? new Promise((resolve) => {
						resolveFirstSupplier = resolve;
					})
				: Promise.resolve(envelope([newerReceipt])),
		);
		detailMock.mockImplementation((_subsidiaryId, id) =>
			Promise.resolve(
				detailOf(id === newerReceipt.id ? newerReceipt : postedKeyboardStockReceipt),
			),
		);

		const { result, rerender } = renderHook(
			({ supplierId }) => useSupplierSuppliedProducts({ subsidiaryId: 2, supplierId }),
			{ initialProps: { supplierId: 7 } },
		);
		expect(result.current.loading).toBe(true);

		rerender({ supplierId: 12 });
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.rows).toHaveLength(2);

		resolveFirstSupplier(envelope([postedKeyboardStockReceipt]));
		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});

		expect(result.current.rows.map((row) => row.last_purchase.stock_receipt_id)).toEqual([
			newerReceipt.id,
			newerReceipt.id,
		]);
	});

	it('un error se muestra y retry vuelve a pedir', async () => {
		authorizeMock.mockReturnValue(true);
		listMock.mockRejectedValueOnce(new Error('boom'));
		listMock.mockResolvedValueOnce(envelope([]));

		const { result } = renderHook(() =>
			useSupplierSuppliedProducts({ subsidiaryId: 2, supplierId: 7 }),
		);

		await waitFor(() => expect(result.current.error).not.toBeNull());
		result.current.retry();
		await waitFor(() => expect(result.current.error).toBeNull());
		expect(result.current.loading).toBe(false);
		expect(result.current.rows).toEqual([]);
		expect(listMock).toHaveBeenCalledTimes(2);
	});
});
