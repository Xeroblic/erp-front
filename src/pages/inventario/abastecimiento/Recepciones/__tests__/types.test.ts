import { describe, expect, it } from 'vitest';
import { EMPTY_RECEPCION_LINE, recepcionFormSchema } from '../types';
import type { IRecepcionFormValues } from '../types';

/**
 * Validación del formulario de recepción (sección 7 del contrato). Dos
 * modos con reglas distintas para el mismo `items`: estas pruebas verifican
 * que el `when('mode', ...)` realmente cambia qué exige cada línea, no sólo
 * que el schema exista.
 */

const withDocumentValues: IRecepcionFormValues = {
	mode: 'with_document',
	purchase_document_id: 61,
	warehouse_id: 8,
	supplier_id: '',
	received_on: '2026-09-08',
	reason: '',
	notes: '',
	items: [
		{
			purchase_document_line_id: 601,
			product_id: '',
			quantity: '4',
			unit_cost: '',
			unit_cost_basis: '',
		},
	],
};

const manualValues: IRecepcionFormValues = {
	mode: 'manual',
	purchase_document_id: '',
	warehouse_id: 8,
	supplier_id: '',
	received_on: '2026-09-04',
	reason: 'Ingreso pendiente de factura',
	notes: '',
	items: [
		{
			purchase_document_line_id: '',
			product_id: 31,
			quantity: '10',
			unit_cost: '',
			unit_cost_basis: '',
		},
	],
};

describe('recepcionFormSchema — modo con documento', () => {
	it('es válido con documento, bodega, fecha y línea completa', async () => {
		await expect(recepcionFormSchema.validate(withDocumentValues)).resolves.toBeTruthy();
	});

	it('exige seleccionar un documento', async () => {
		await expect(
			recepcionFormSchema.validate({ ...withDocumentValues, purchase_document_id: '' }),
		).rejects.toThrow(/documento/i);
	});

	it('cada línea exige la línea del documento y una cantidad positiva', async () => {
		await expect(
			recepcionFormSchema.validate({
				...withDocumentValues,
				items: [{ ...withDocumentValues.items[0], purchase_document_line_id: '' }],
			}),
		).rejects.toThrow(/línea/i);

		await expect(
			recepcionFormSchema.validate({
				...withDocumentValues,
				items: [{ ...withDocumentValues.items[0], quantity: '0' }],
			}),
		).rejects.toThrow(/mayor que cero/i);
	});

	it('no exige motivo (es propio del modo manual)', async () => {
		await expect(
			recepcionFormSchema.validate({ ...withDocumentValues, reason: '' }),
		).resolves.toBeTruthy();
	});
});

describe('recepcionFormSchema — modo manual', () => {
	it('es válido con bodega, fecha y motivo', async () => {
		await expect(recepcionFormSchema.validate(manualValues)).resolves.toBeTruthy();
	});

	it('exige motivo', async () => {
		await expect(recepcionFormSchema.validate({ ...manualValues, reason: '' })).rejects.toThrow(
			/motivo/i,
		);
	});

	it('cada línea exige producto y cantidad positiva', async () => {
		await expect(
			recepcionFormSchema.validate({ ...manualValues, items: [{ ...EMPTY_RECEPCION_LINE }] }),
		).rejects.toThrow();

		await expect(
			recepcionFormSchema.validate({
				...manualValues,
				items: [{ ...manualValues.items[0], quantity: '-1' }],
			}),
		).rejects.toThrow(/mayor que cero/i);
	});

	it('el costo es opcional, pero monto y base viajan juntos', async () => {
		await expect(recepcionFormSchema.validate(manualValues)).resolves.toBeTruthy();

		await expect(
			recepcionFormSchema.validate({
				...manualValues,
				items: [{ ...manualValues.items[0], unit_cost: '5000.00' }],
			}),
		).rejects.toThrow();

		await expect(
			recepcionFormSchema.validate({
				...manualValues,
				items: [
					{ ...manualValues.items[0], unit_cost: '5000.00', unit_cost_basis: 'gross' },
				],
			}),
		).resolves.toBeTruthy();
	});
});

describe('recepcionFormSchema — campos comunes', () => {
	it('exige bodega y fecha de recepción en ambos modos', async () => {
		await expect(
			recepcionFormSchema.validate({ ...manualValues, warehouse_id: '' }),
		).rejects.toThrow(/bodega/i);
		await expect(
			recepcionFormSchema.validate({ ...manualValues, received_on: '' }),
		).rejects.toThrow(/fecha/i);
	});

	it('exige al menos una línea', async () => {
		await expect(recepcionFormSchema.validate({ ...manualValues, items: [] })).rejects.toThrow(
			/línea/i,
		);
	});
});
