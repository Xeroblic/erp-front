import { afterEach, describe, expect, it } from 'vitest';
import { keyboardProduct, notebookProduct } from '@/mocks/db/procurement.db';
import {
	createProcurementProduct,
	findPurchasableProcurementProduct,
	formatProcurementProductLabel,
	isProcurementProductSkuTaken,
	listPurchasableProcurementProducts,
	resetProcurementProductsStoreForTests,
} from '../procurementProducts.service';

const SUBSIDIARY_A = 2;
const SUBSIDIARY_B = 3;

const payload = {
	name: 'Hub USB-C 7 en 1',
	brand: { id: 21, name: 'Samsung', slug: 'samsung' },
	sku: 'HUB-USBC-7',
	categories: [{ id: 14, name: 'Almacenamiento', slug: 'almacenamiento' }],
	serial_tracking: false,
	is_active: true,
};

const rejectionOf = async (promise: Promise<unknown>) => {
	try {
		await promise;
	} catch (error) {
		return error as { response: { status: number; data: Record<string, unknown> } };
	}
	throw new Error('Se esperaba un rechazo.');
};

afterEach(() => {
	resetProcurementProductsStoreForTests();
});

describe('procurementProducts.service', () => {
	it('suma el producto creado a los elegibles de su filial y sólo de ella', async () => {
		const { data } = await createProcurementProduct(SUBSIDIARY_A, payload);

		expect(data).toMatchObject({
			sku: 'HUB-USBC-7',
			brand: payload.brand,
			categories: payload.categories,
			serial_tracking: false,
			cost: null,
			cost_basis: 'unknown',
		});
		expect(findPurchasableProcurementProduct(SUBSIDIARY_A, data.id)).toEqual(data);
		expect(findPurchasableProcurementProduct(SUBSIDIARY_B, data.id)).toBeUndefined();
		expect(listPurchasableProcurementProducts(null).some((row) => row.id === data.id)).toBe(
			false,
		);
	});

	it('acepta un producto sin SKU ni categorías, como el alta por filial', async () => {
		const { data } = await createProcurementProduct(SUBSIDIARY_A, {
			...payload,
			sku: null,
			categories: [],
		});
		const second = await createProcurementProduct(SUBSIDIARY_A, {
			...payload,
			name: 'Otro sin SKU',
			sku: '  ',
			categories: [],
		});

		expect(data.sku).toBe('');
		expect(second.data.sku).toBe('');
		expect(formatProcurementProductLabel(data)).toBe('Hub USB-C 7 en 1');
	});

	it('rechaza un SKU ya usado, incluso de un producto serializado y sin distinguir mayúsculas', async () => {
		const duplicateOfSeed = await rejectionOf(
			createProcurementProduct(SUBSIDIARY_A, {
				...payload,
				sku: notebookProduct.sku.toLowerCase(),
			}),
		);
		expect(duplicateOfSeed.response.status).toBe(422);
		expect(duplicateOfSeed.response.data).toMatchObject({
			code: 'PRODUCT_SKU_ALREADY_EXISTS',
			errors: { sku: ['Ya existe un producto con este SKU en la filial.'] },
		});

		await createProcurementProduct(SUBSIDIARY_A, payload);
		const duplicateOfCreated = await rejectionOf(
			createProcurementProduct(SUBSIDIARY_A, payload),
		);
		expect(duplicateOfCreated.response.data).toMatchObject({
			code: 'PRODUCT_SKU_ALREADY_EXISTS',
		});
	});

	it('exige nombre y marca', async () => {
		const withoutName = await rejectionOf(
			createProcurementProduct(SUBSIDIARY_A, { ...payload, name: '   ' }),
		);
		expect(withoutName.response.data).toMatchObject({ errors: { name: expect.any(Array) } });

		const withoutBrand = await rejectionOf(
			createProcurementProduct(SUBSIDIARY_A, { ...payload, brand: null }),
		);
		expect(withoutBrand.response.data).toMatchObject({
			code: 'PRODUCT_BRAND_REQUIRED',
			errors: { brand_id: expect.any(Array) },
		});
	});

	it('la misma Idempotency-Key con el mismo payload devuelve el mismo producto', async () => {
		const first = await createProcurementProduct(SUBSIDIARY_A, payload, {
			idempotencyKey: 'k1',
		});
		const retry = await createProcurementProduct(SUBSIDIARY_A, payload, {
			idempotencyKey: 'k1',
		});

		expect(retry.data.id).toBe(first.data.id);
		expect(
			listPurchasableProcurementProducts(SUBSIDIARY_A).filter(
				(row) => row.sku === payload.sku,
			),
		).toHaveLength(1);
	});

	it('guarda serie y estado, y un producto con serie no es elegible para una línea', async () => {
		const serialized = await createProcurementProduct(SUBSIDIARY_A, {
			...payload,
			sku: 'NB-SERIE-1',
			serial_tracking: true,
		});
		const inactive = await createProcurementProduct(SUBSIDIARY_A, {
			...payload,
			sku: 'HUB-INACTIVO',
			is_active: false,
		});

		expect(serialized.data.serial_tracking).toBe(true);
		expect(findPurchasableProcurementProduct(SUBSIDIARY_A, serialized.data.id)).toBeUndefined();
		// El SKU del serializado sigue ocupado aunque no sea elegible.
		expect(isProcurementProductSkuTaken(SUBSIDIARY_A, 'NB-SERIE-1')).toBe(true);
		expect(inactive.data.is_active).toBe(false);
		expect(findPurchasableProcurementProduct(SUBSIDIARY_A, inactive.data.id)).toEqual(
			inactive.data,
		);
	});

	it('informa si un SKU ya está tomado en la filial, para reintentar la generación', async () => {
		expect(isProcurementProductSkuTaken(SUBSIDIARY_A, notebookProduct.sku.toLowerCase())).toBe(
			true,
		);
		expect(isProcurementProductSkuTaken(SUBSIDIARY_A, payload.sku)).toBe(false);
		expect(isProcurementProductSkuTaken(SUBSIDIARY_A, '   ')).toBe(false);

		await createProcurementProduct(SUBSIDIARY_A, payload);

		expect(isProcurementProductSkuTaken(SUBSIDIARY_A, payload.sku)).toBe(true);
		expect(isProcurementProductSkuTaken(SUBSIDIARY_B, payload.sku)).toBe(false);
	});

	it('conserva los fixtures elegibles', () => {
		expect(findPurchasableProcurementProduct(SUBSIDIARY_A, keyboardProduct.id)).toEqual(
			keyboardProduct,
		);
		expect(findPurchasableProcurementProduct(SUBSIDIARY_A, notebookProduct.id)).toBeUndefined();
		expect(formatProcurementProductLabel(keyboardProduct)).toBe(
			`${keyboardProduct.sku} · ${keyboardProduct.name}`,
		);
	});
});
