import { describe, expect, it } from 'vitest';
import { shortageLineFrom } from '@/pages/inventario/abastecimiento/AjustesTraslados/types';

const shortage = (context: Record<string, unknown> | null) => ({
	code: 'INSUFFICIENT_LOCATION_STOCK',
	context,
});

/** Dos líneas del mismo producto: comparten `product_id` (y podrían compartir condición). */
const SAME_PRODUCT = [{ productId: 31 }, { productId: 31 }];

describe('shortageLineFrom', () => {
	it('toma la línea por `item_index`, no por producto', () => {
		expect(
			shortageLineFrom(
				shortage({ item_index: 1, product_id: 31, requested: 5, available: 2 }),
				SAME_PRODUCT,
			),
		).toEqual({ index: 1, available: 2 });
	});

	it('sin `item_index` o con uno que no es una línea del lote, no marca ninguna', () => {
		expect(shortageLineFrom(shortage({ available: 2 }), SAME_PRODUCT)).toBeNull();
		expect(shortageLineFrom(shortage(null), SAME_PRODUCT)).toBeNull();
		expect(
			shortageLineFrom(shortage({ item_index: 2, available: 2 }), SAME_PRODUCT),
		).toBeNull();
		expect(
			shortageLineFrom(shortage({ item_index: -1, available: 2 }), SAME_PRODUCT),
		).toBeNull();
		expect(
			shortageLineFrom(shortage({ item_index: '1', available: 2 }), SAME_PRODUCT),
		).toBeNull();
	});

	it('descarta el índice si su `product_id` no es el de esa línea', () => {
		expect(
			shortageLineFrom(shortage({ item_index: 0, product_id: 32, available: 2 }), [
				{ productId: 31 },
			]),
		).toBeNull();
	});

	it('sin `available` o con otro código, no marca ninguna línea', () => {
		expect(shortageLineFrom(shortage({ item_index: 0 }), SAME_PRODUCT)).toBeNull();
		expect(
			shortageLineFrom(
				{ code: 'MULTI_LOCATION_NOT_ENABLED', context: { item_index: 0, available: 2 } },
				SAME_PRODUCT,
			),
		).toBeNull();
		expect(shortageLineFrom(null, SAME_PRODUCT)).toBeNull();
	});
});
