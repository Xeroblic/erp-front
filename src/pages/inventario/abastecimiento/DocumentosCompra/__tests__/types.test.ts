import { describe, expect, it } from 'vitest';
import { documentoCompraFormSchema, EMPTY_DOCUMENTO_LINE } from '../types';
import type { IDocumentoCompraFormValues } from '../types';

/**
 * Validación del formulario de documento de compra (sección 6 del
 * contrato). La factura exige proveedor y la boleta lo permite `null`; el
 * costo unitario reutiliza `costEntrySchema` de `@/components/procurement`
 * (card 02): estas pruebas verifican que ese reuso realmente ata monto y
 * base a cada línea, no sólo que el schema exista.
 */

const validLine = {
	product_id: 31,
	quantity: '2',
	unit_cost: '5000.00',
	unit_cost_basis: 'gross' as const,
	notes: '',
};

const baseValues: IDocumentoCompraFormValues = {
	document_type: 'receipt',
	supplier_id: '',
	document_number: '55012',
	issue_date: '2026-09-06',
	total_amount: '',
	notes: '',
	include_shipping: false,
	shipping_cost: '',
	shipping_cost_basis: '',
	items: [validLine],
};

describe('documentoCompraFormSchema', () => {
	it('la boleta es válida sin proveedor', async () => {
		await expect(documentoCompraFormSchema.validate(baseValues)).resolves.toBeTruthy();
	});

	it('la factura sin proveedor es inválida', async () => {
		await expect(
			documentoCompraFormSchema.validate({ ...baseValues, document_type: 'invoice' }),
		).rejects.toThrow(/proveedor/i);
	});

	it('la factura con proveedor es válida', async () => {
		await expect(
			documentoCompraFormSchema.validate({
				...baseValues,
				document_type: 'invoice',
				supplier_id: 7,
			}),
		).resolves.toBeTruthy();
	});

	it('exige folio y fecha de emisión', async () => {
		await expect(
			documentoCompraFormSchema.validate({ ...baseValues, document_number: '' }),
		).rejects.toThrow(/folio/i);
		await expect(
			documentoCompraFormSchema.validate({ ...baseValues, issue_date: '' }),
		).rejects.toThrow(/emisión/i);
	});

	it('exige al menos una línea', async () => {
		await expect(
			documentoCompraFormSchema.validate({ ...baseValues, items: [] }),
		).rejects.toThrow(/línea/i);
	});

	it('cada línea exige producto, cantidad positiva, costo y base', async () => {
		await expect(
			documentoCompraFormSchema.validate({
				...baseValues,
				items: [{ ...EMPTY_DOCUMENTO_LINE }],
			}),
		).rejects.toThrow();

		await expect(
			documentoCompraFormSchema.validate({
				...baseValues,
				items: [{ ...validLine, quantity: '0' }],
			}),
		).rejects.toThrow(/mayor que cero/i);

		await expect(
			documentoCompraFormSchema.validate({
				...baseValues,
				items: [{ ...validLine, unit_cost: '', unit_cost_basis: '' }],
			}),
		).rejects.toThrow();
	});
});
