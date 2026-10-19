import { describe, expect, it } from 'vitest';
import {
	EMPTY_RECEPCION_LINE,
	parseRecepcionesFilters,
	serializeRecepcionesFilters,
	stockReceiptFormSchema,
} from '../types';
import type { IRecepcionesFilters, IStockReceiptFormValues } from '../types';

/**
 * Validación del formulario de recepción (sección 7 del contrato). Dos
 * modos con reglas distintas para el mismo `items`: estas pruebas verifican
 * que el `when('mode', ...)` realmente cambia qué exige cada línea, no sólo
 * que el schema exista.
 */

const withDocumentValues: IStockReceiptFormValues = {
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

const manualValues: IStockReceiptFormValues = {
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

describe('stockReceiptFormSchema — modo con documento', () => {
	it('es válido con documento, bodega, fecha y línea completa', async () => {
		await expect(stockReceiptFormSchema.validate(withDocumentValues)).resolves.toBeTruthy();
	});

	it('exige seleccionar un documento', async () => {
		await expect(
			stockReceiptFormSchema.validate({ ...withDocumentValues, purchase_document_id: '' }),
		).rejects.toThrow(/documento/i);
	});

	it('cada línea exige la línea del documento', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [{ ...withDocumentValues.items[0], purchase_document_line_id: '' }],
			}),
		).rejects.toThrow(/línea/i);
	});

	it('una línea en 0 significa «no llegó» y se acepta si otra recibe algo', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [
					{ ...withDocumentValues.items[0], quantity: '0' },
					{
						...withDocumentValues.items[0],
						purchase_document_line_id: 602,
						quantity: '2',
					},
				],
			}),
		).resolves.toBeTruthy();
	});

	it('exige recibir algo de al menos una línea', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [{ ...withDocumentValues.items[0], quantity: '0' }],
			}),
		).rejects.toThrow(/al menos una línea/i);
	});

	it('no acepta más que lo pendiente de la línea ni cantidades negativas', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [{ ...withDocumentValues.items[0], pending_quantity: 3, quantity: '4' }],
			}),
		).rejects.toThrow(/pendiente/i);

		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [
					{ ...withDocumentValues.items[0], quantity: '-1' },
					{
						...withDocumentValues.items[0],
						purchase_document_line_id: 602,
						quantity: '2',
					},
				],
			}),
		).rejects.toThrow(/negativa/i);
	});

	it('no exige motivo (es propio del modo manual)', async () => {
		await expect(
			stockReceiptFormSchema.validate({ ...withDocumentValues, reason: '' }),
		).resolves.toBeTruthy();
	});
});

describe('stockReceiptFormSchema — modo manual', () => {
	it('es válido con bodega, fecha y motivo', async () => {
		await expect(stockReceiptFormSchema.validate(manualValues)).resolves.toBeTruthy();
	});

	it('exige motivo', async () => {
		await expect(
			stockReceiptFormSchema.validate({ ...manualValues, reason: '' }),
		).rejects.toThrow(/motivo/i);
	});

	it('cada línea exige producto y cantidad positiva', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...manualValues,
				items: [{ ...EMPTY_RECEPCION_LINE }],
			}),
		).rejects.toThrow();

		await expect(
			stockReceiptFormSchema.validate({
				...manualValues,
				items: [{ ...manualValues.items[0], quantity: '-1' }],
			}),
		).rejects.toThrow(/mayor que cero/i);
	});

	it('el costo es opcional, pero monto y base viajan juntos', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...manualValues,
				items: [{ ...manualValues.items[0], unit_cost: '5000.00' }],
			}),
		).rejects.toThrow();

		await expect(
			stockReceiptFormSchema.validate({
				...manualValues,
				items: [
					{ ...manualValues.items[0], unit_cost: '5000.00', unit_cost_basis: 'gross' },
				],
			}),
		).resolves.toBeTruthy();
	});
});

describe('stockReceiptFormSchema — campos comunes', () => {
	it('exige bodega y fecha de recepción en ambos modos', async () => {
		await expect(
			stockReceiptFormSchema.validate({ ...manualValues, warehouse_id: '' }),
		).rejects.toThrow(/bodega/i);
		await expect(
			stockReceiptFormSchema.validate({ ...manualValues, received_on: '' }),
		).rejects.toThrow(/fecha/i);
	});

	it('exige al menos una línea', async () => {
		await expect(
			stockReceiptFormSchema.validate({ ...manualValues, items: [] }),
		).rejects.toThrow(/línea/i);
	});
});

describe('stockReceiptFormSchema — varias filas de la misma línea del documento', () => {
	const row = (id: number, quantity: string) => ({
		...EMPTY_RECEPCION_LINE,
		id,
		purchase_document_line_id: 601,
		pending_quantity: 5,
		quantity,
	});

	it('acepta filas repetidas mientras la suma no supere lo pendiente', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [row(1, '2'), row(2, '3')],
			}),
		).resolves.toBeTruthy();
	});

	it('rechaza filas repetidas cuya suma supera lo pendiente, aunque cada una quepa', async () => {
		await expect(
			stockReceiptFormSchema.validate({
				...withDocumentValues,
				items: [row(1, '3'), row(2, '3')],
			}),
		).rejects.toThrow(/suman más que lo pendiente/i);
	});
});

describe('Filtros del listado en la URL', () => {
	const defaultFilters: IRecepcionesFilters = {
		search: '',
		status: 'all',
		warehouseId: '',
		receivedFrom: '',
		receivedTo: '',
		page: 1,
		perPage: 20,
	};

	it('sin parámetros son los valores por defecto y no escriben nada', () => {
		const filters = parseRecepcionesFilters(new URLSearchParams());
		expect(filters).toEqual(defaultFilters);
		expect(serializeRecepcionesFilters(filters).toString()).toBe('');
	});

	it('ida y vuelta conserva todos los filtros con las claves del contrato', () => {
		const filters: IRecepcionesFilters = {
			search: 'mouse',
			status: 'posted',
			warehouseId: 8,
			receivedFrom: '2026-09-01',
			receivedTo: '2026-09-30',
			page: 3,
			perPage: 10,
		};
		const params = serializeRecepcionesFilters(filters);
		expect(params.toString()).toBe(
			'search=mouse&status=posted&warehouse_id=8&received_from=2026-09-01&received_to=2026-09-30&page=3&per_page=10',
		);
		expect(parseRecepcionesFilters(params)).toEqual(filters);
	});

	it('valores desconocidos caen al defecto y purchase_document_id no es un filtro', () => {
		const params = new URLSearchParams(
			'status=borrado&warehouse_id=-1&received_to=2026-13-01&page=x&purchase_document_id=24',
		);
		expect(parseRecepcionesFilters(params)).toEqual(defaultFilters);
	});
});
