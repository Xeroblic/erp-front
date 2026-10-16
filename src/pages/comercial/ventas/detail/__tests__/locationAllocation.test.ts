import { describe, expect, it } from 'vitest';
import type { ISaleFulfillmentOptionItem, ISaleItem } from '@/interface/sales.interface';
import { resolveSaleCloseError } from '@/utils/saleCloseErrors.util';
import { buildLocationAllocationSchema, type ILocationAllocationValues } from '../types';
import {
	buildLocationAllocationValues,
	describeLocation,
	getUnlistedSerialItemIds,
	toCloseAllocationItems,
} from '../utils/locationAllocation';

const option = (
	saleItemId: number,
	overrides: Partial<ISaleFulfillmentOptionItem> = {},
): ISaleFulfillmentOptionItem => ({
	sale_item_id: saleItemId,
	branch_id: 4,
	product: { id: 31, sku: 'CAB-1', name: 'Cable HDMI' },
	quantity_required: 5,
	own_hold_quantity: 5,
	stock_sufficient: true,
	allocation_mode: 'manual',
	suggested_allocations: [
		{ warehouse_id: 8, quantity: 3 },
		{ warehouse_id: null, quantity: 2 },
	],
	locations: [
		{ warehouse_id: null, name: 'Sin ubicación', fit_quantity: 4 },
		{ warehouse_id: 8, name: 'Bodega Central', fit_quantity: 3 },
	],
	...overrides,
});

const validationMessages = async (
	options: ISaleFulfillmentOptionItem[],
	values: ILocationAllocationValues,
): Promise<string[]> => {
	try {
		await buildLocationAllocationSchema(options).validate(values, { abortEarly: false });
		return [];
	} catch (error: unknown) {
		return (error as { errors: string[] }).errors;
	}
};

describe('getUnlistedSerialItemIds', () => {
	it('sólo agrega ítems rechazados con producto válido ausentes de las opciones sin serie', () => {
		const error = resolveSaleCloseError({
			response: {
				status: 422,
				data: {
					message: 'Validación por ítem',
					errors: Object.fromEntries(
						[201, 202, 203, 204, 999].map((id) => [id, ['Revisa el ítem.']]),
					),
				},
			},
		});
		const saleItems = [201, 202, 203, 204].map((id) => ({
			id,
			product_id: id,
			product: id === 203 ? undefined : { id },
			quantity: id === 204 ? 0 : 1,
		})) as ISaleItem[];
		expect(getUnlistedSerialItemIds(error, [option(201)], saleItems)).toEqual([202]);
		expect(getUnlistedSerialItemIds({ ...error, status: 409 }, [], saleItems)).toEqual([]);
	});
});

describe('buildLocationAllocationValues', () => {
	it('sólo los ítems manuales llevan elección y parten de la sugerencia', () => {
		const values = buildLocationAllocationValues([
			option(201),
			option(202, { allocation_mode: 'automatic' }),
			option(203, { allocation_mode: 'blocked', suggested_allocations: [] }),
		]);

		expect(values).toEqual({
			items: {
				item_201: {
					rows: [
						{ warehouseKey: '8', quantity: 3 },
						{ warehouseKey: 'none', quantity: 2 },
					],
				},
			},
		});
	});

	it('al recargar conserva la elección del usuario salvo en los ítems rechazados', () => {
		const chosen = {
			rows: [
				{ warehouseKey: 'none', quantity: 4 },
				{ warehouseKey: '8', quantity: 1 },
			],
		};
		const previous: ILocationAllocationValues = {
			items: { item_201: chosen, item_202: chosen },
		};

		const values = buildLocationAllocationValues([option(201), option(202)], previous, [202]);

		expect(values.items.item_201).toBe(chosen);
		expect(values.items.item_202.rows).toEqual([
			{ warehouseKey: '8', quantity: 3 },
			{ warehouseKey: 'none', quantity: 2 },
		]);
	});

	it('descarta una elección cuya ubicación ya no se ofrece', () => {
		const previous: ILocationAllocationValues = {
			items: { item_201: { rows: [{ warehouseKey: '9', quantity: 5 }] } },
		};

		const values = buildLocationAllocationValues([option(201)], previous);

		expect(values.items.item_201.rows[0]).toEqual({ warehouseKey: '8', quantity: 3 });
	});
});

describe('buildLocationAllocationSchema', () => {
	it('acepta la sugerencia tal cual', async () => {
		const options = [option(201)];
		expect(await validationMessages(options, buildLocationAllocationValues(options))).toEqual(
			[],
		);
	});

	it('exige que la suma dé la cantidad, sin repetir ubicación ni superar el apto', async () => {
		const messages = await validationMessages([option(201)], {
			items: {
				item_201: {
					rows: [
						{ warehouseKey: '8', quantity: 4 },
						{ warehouseKey: '8', quantity: 2 },
					],
				},
			},
		});

		expect(messages).toEqual(
			expect.arrayContaining([
				'«Bodega Central» tiene 3 unidades aptas.',
				'No repitas una ubicación en el mismo ítem.',
				'Las ubicaciones suman 6 y el ítem pide 5.',
			]),
		);
	});

	it('pide ubicación y cantidad en una fila vacía', async () => {
		const messages = await validationMessages([option(201, { quantity_required: 1 })], {
			items: { item_201: { rows: [{ warehouseKey: '', quantity: '' }] } },
		});

		expect(messages).toEqual(
			expect.arrayContaining(['Elige una ubicación.', 'Indica la cantidad.']),
		);
	});
});

describe('toCloseAllocationItems', () => {
	it('arma allocations sólo para los manuales, con null para «Sin ubicación»', () => {
		const options = [option(201), option(202, { allocation_mode: 'automatic' })];

		expect(toCloseAllocationItems(options, buildLocationAllocationValues(options))).toEqual([
			{
				sale_item_id: 201,
				allocations: [
					{ warehouse_id: 8, quantity: 3 },
					{ warehouse_id: null, quantity: 2 },
				],
			},
		]);
	});
});

describe('describeLocation', () => {
	it('nombra «Sin ubicación», una bodega conocida y una desconocida', () => {
		const names = new Map([[8, 'Bodega Central']]);
		expect(describeLocation(null, names)).toBe('Sin ubicación');
		expect(describeLocation(8, names)).toBe('Bodega Central');
		expect(describeLocation(12, names)).toBe('Bodega #12');
	});
});
