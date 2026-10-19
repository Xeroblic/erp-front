import { describe, expect, it } from 'vitest';
import { ajusteLineErrorsFrom } from '@/pages/inventario/abastecimiento/AjustesTraslados/adjustment.types';

describe('ajusteLineErrorsFrom', () => {
	it('lleva cada `items.N.campo` del 422 al campo de su línea', () => {
		expect(
			ajusteLineErrorsFrom({
				'items.0.product_id': ['El producto no es de la filial.', 'Otro mensaje.'],
				'items.2.quantity_delta': ['La cantidad del ajuste no puede ser cero.'],
				'items.2.condition': ['Indica la condición.'],
				reason: ['Indica el motivo del ajuste.'],
			}),
		).toEqual({
			0: { productId: 'El producto no es de la filial.' },
			2: {
				quantityDelta: 'La cantidad del ajuste no puede ser cero.',
				condition: 'Indica la condición.',
			},
		});
	});

	it('marca en el producto lo que no tiene campo propio, sin pisar su mensaje', () => {
		expect(
			ajusteLineErrorsFrom({
				'items.1.product_id': ['Producto serializado.'],
				'items.1.origin_id': ['El origen no tiene stock en esa ubicación.'],
				'items.3.origin_id': ['El origen no tiene stock en esa ubicación.'],
			}),
		).toEqual({
			1: { productId: 'Producto serializado.' },
			3: { productId: 'El origen no tiene stock en esa ubicación.' },
		});
	});

	it('sin errores de campo no marca ninguna línea', () => {
		expect(ajusteLineErrorsFrom(null)).toEqual({});
		expect(ajusteLineErrorsFrom({ items: ['Agrega al menos un producto.'] })).toEqual({});
	});
});
