import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	collectValidationErrorPaths,
	focusFirstInvalidPurchaseDocumentField,
	getFirstInvalidPurchaseDocumentFieldId,
} from '../purchaseDocumentFieldFocus';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('purchaseDocumentFieldFocus', () => {
	it('recorre errores anidados de líneas como rutas con punto', () => {
		expect(
			collectValidationErrorPaths({
				supplier_id: 'La factura requiere proveedor.',
				items: [undefined, { quantity: 'Indica la cantidad.' }],
			}),
		).toEqual(['supplier_id', 'items.1.quantity']);
	});

	it('prioriza los datos del documento en orden visual y devuelve su id del DOM', () => {
		expect(
			getFirstInvalidPurchaseDocumentFieldId({
				issue_date: 'Indica la fecha de emisión.',
				supplier_id: 'La factura requiere proveedor.',
				items: [{ product_id: 'Selecciona un producto.' }],
			}),
		).toBe('documento-supplier');
	});

	it('con el documento válido, elige la primera línea y su primer campo en orden visual', () => {
		expect(
			getFirstInvalidPurchaseDocumentFieldId({
				items: [
					undefined,
					{
						unit_cost: 'Indica el costo unitario.',
						product_id: 'Selecciona un producto.',
					},
					{ quantity: 'Indica la cantidad.' },
				],
			}),
		).toBe('items.1.product_id');
	});

	it('deja el envío para el final y no enfoca nada sin errores', () => {
		expect(
			getFirstInvalidPurchaseDocumentFieldId({ shipping_cost: 'Indica el costo de envío.' }),
		).toBe('shipping-cost');
		expect(getFirstInvalidPurchaseDocumentFieldId({})).toBeNull();
		// El error de la colección (sin líneas) no corresponde a un campo enfocable.
		expect(
			getFirstInvalidPurchaseDocumentFieldId({ items: 'Agrega al menos una línea.' }),
		).toBeNull();
	});

	it('desplaza al centro y enfoca el campo inválido', () => {
		document.body.innerHTML = "<input id='documento-number' />";
		const field = document.getElementById('documento-number') as HTMLInputElement;
		const scrollIntoView = vi.fn();
		field.scrollIntoView = scrollIntoView;

		focusFirstInvalidPurchaseDocumentField({ document_number: 'Indica el folio.' });

		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
		expect(document.activeElement).toBe(field);
	});
});
