/**
 * El detalle de producto no envía `stock`: el PATCH de sucursal lo quita y el de
 * filial no lo valida, así que un stock editado se perdía sin aviso. El stock
 * se mueve por recepción o ajuste en la sucursal donde está.
 */
import { describe, it, expect } from 'vitest';
import { buildUpdatePayload } from '@/components/helper/product.helper';
import type { IProduct } from '@/interface/product.interface';
import { buildDetailUpdatePayload, mapProductToDetailForm } from '../productForm.utils';

const PRODUCT = {
	id: 10,
	sku: 'NB-01',
	name: 'Notebook',
	brand_id: 2,
	product_type: 'general',
	serial_tracking: false,
	is_active: true,
	price: 1000,
	stock: 4,
} as unknown as IProduct;

describe('payload de actualización del detalle de producto', () => {
	it('buildDetailUpdatePayload no incluye stock aunque el formulario lo cambie', () => {
		const form = { ...mapProductToDetailForm(PRODUCT), stock: 9, price: 1200 };

		const payload = buildDetailUpdatePayload(PRODUCT, form);

		expect(payload).not.toHaveProperty('stock');
		expect(payload).toMatchObject({ price: 1200 });
	});

	it('buildUpdatePayload no reenvía el stock que llegue en los datos', () => {
		const payload = buildUpdatePayload(PRODUCT.id, { name: 'Notebook 2', stock: 9 });

		expect(payload).not.toHaveProperty('stock');
		expect(payload).toMatchObject({ id: 10, name: 'Notebook 2' });
	});
});
