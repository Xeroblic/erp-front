import { describe, expect, it } from 'vitest';
import type { ISaleReturn, ISaleReturnItem } from '@/interface/sales.interface';
import { UNLOCATED_KEY, buildReturnReceiptSchema, type IReturnReceiptValues } from '../types';
import {
	buildReturnReceiptValues,
	groupReturnFieldErrors,
	toConfirmReturnRequest,
} from '../utils/saleReturnReceipt';

const MOUSE: ISaleReturnItem = {
	sale_item_id: 201,
	branch_id: 4,
	product: { id: 31, sku: 'MOU-01', name: 'Mouse' },
	serial_tracking: false,
	quantity_expected: 5,
	serial_numbers: [],
	received_allocations: [],
};

const NOTEBOOK: ISaleReturnItem = {
	sale_item_id: 202,
	branch_id: 4,
	product: { id: 40, sku: 'NB-1', name: 'Notebook' },
	serial_tracking: true,
	quantity_expected: 1,
	serial_numbers: ['SN-100'],
	received_allocations: [],
};

const saleReturn: ISaleReturn = {
	id: 12,
	sale_id: 90,
	sale_cycle: 0,
	status: 'pending_receipt',
	source: 'manual',
	reason: 'El cliente devuelve la compra',
	items: [MOUSE, NOTEBOOK],
	created_at: null,
	received_at: null,
	received_by: null,
	inventory_operation_id: null,
};

/** Bodega Central (8) es de la sucursal 4; la 9 es de otra. */
const offered = new Map([[4, new Set([UNLOCATED_KEY, '8'])]]);
const schema = buildReturnReceiptSchema(saleReturn.items, offered);

const values = (overrides: Partial<IReturnReceiptValues['items']> = {}): IReturnReceiptValues => ({
	items: {
		item_201: {
			rows: [
				{ warehouseKey: '8', quantity: 3, condition: 'fit', reason: 'ignorado' },
				{
					warehouseKey: UNLOCATED_KEY,
					quantity: 2,
					condition: 'unfit',
					reason: ' No enciende ',
				},
			],
			serials: [],
		},
		item_202: {
			rows: [],
			serials: [
				{
					serialNumber: 'SN-100',
					warehouseKey: '8',
					condition: 'unfit',
					reason: 'No inicia',
				},
			],
		},
		...overrides,
	},
});

const validationErrors = async (input: IReturnReceiptValues): Promise<string[]> => {
	try {
		await schema.validate(input, { abortEarly: false });
		return [];
	} catch (error: unknown) {
		return (error as { inner: Array<{ path: string; message: string }> }).inner.map(
			(entry) => `${entry.path}: ${entry.message}`,
		);
	}
};

describe('cuerpo de confirm-return en la etapa 2', () => {
	it('manda return_id e items en el orden de la devolución, con allocations o serials', () => {
		expect(toConfirmReturnRequest(saleReturn, values())).toEqual({
			return_id: 12,
			items: [
				{
					sale_item_id: 201,
					allocations: [
						{ warehouse_id: 8, quantity: 3, condition: 'fit', reason: null },
						{
							warehouse_id: null,
							quantity: 2,
							condition: 'unfit',
							reason: 'No enciende',
						},
					],
				},
				{
					sale_item_id: 202,
					serials: [
						{
							serial_number: 'SN-100',
							warehouse_id: 8,
							condition: 'unfit',
							reason: 'No inicia',
						},
					],
				},
			],
		});
	});

	it('una serie con «Conservar su bodega» viaja con warehouse_id null', () => {
		const initial = buildReturnReceiptValues(saleReturn.items);
		const body = toConfirmReturnRequest(saleReturn, initial);
		expect(body.items[1]).toEqual({
			sale_item_id: 202,
			serials: [
				{ serial_number: 'SN-100', warehouse_id: null, condition: 'fit', reason: null },
			],
		});
	});
});

describe('validación de la recepción', () => {
	it('acepta las partes que suman lo esperado, con motivo en lo no apto', async () => {
		expect(await validationErrors(values())).toEqual([]);
	});

	it('rechaza un ítem sin serie cuyas partes no suman quantity_expected', async () => {
		const errors = await validationErrors(
			values({
				item_201: {
					rows: [{ warehouseKey: '8', quantity: 4, condition: 'fit', reason: '' }],
					serials: [],
				},
			}),
		);
		expect(errors).toEqual([
			'items.item_201.summary: Las partes suman 4 y vuelven 5 unidades.',
		]);
	});

	it('exige motivo en una parte no apta y en una serie no apta, no en lo apto', async () => {
		const errors = await validationErrors(
			values({
				item_201: {
					rows: [
						{ warehouseKey: '8', quantity: 3, condition: 'fit', reason: '' },
						{ warehouseKey: '8', quantity: 2, condition: 'unfit', reason: '   ' },
					],
					serials: [],
				},
				item_202: {
					rows: [],
					serials: [
						{
							serialNumber: 'SN-100',
							warehouseKey: '8',
							condition: 'unfit',
							reason: '',
						},
					],
				},
			}),
		);
		expect(errors).toEqual([
			'items.item_201.rows[1].reason: Indica por qué no es apta.',
			'items.item_202.serials[0].reason: Indica por qué no es apta.',
		]);
	});

	it('rechaza una bodega que no es de la sucursal a la que vuelve el ítem', async () => {
		const errors = await validationErrors(
			values({
				item_201: {
					rows: [{ warehouseKey: '9', quantity: 5, condition: 'fit', reason: '' }],
					serials: [],
				},
			}),
		);
		expect(errors).toEqual([
			'items.item_201.rows[0].warehouseKey: Esa bodega no es de la sucursal a la que vuelve el ítem.',
		]);
	});
});

describe('errores con ruta del 422', () => {
	it('marca cada error items.N en su ítem y deja aparte los que no nombran uno', () => {
		const grouped = groupReturnFieldErrors(
			{
				'items.0.allocations.1.warehouse_id': ['La bodega no está activa.'],
				'items.1.serials.0.serial_number': ['La serie no es de la venta.'],
				items: ['Falta un ítem de la devolución.'],
			},
			saleReturn,
			values(),
		);
		expect(grouped).toEqual({
			byItem: {
				201: ['Parte 2: La bodega no está activa.'],
				202: ['Serie SN-100: La serie no es de la venta.'],
			},
			general: ['Falta un ítem de la devolución.'],
		});
	});
});
