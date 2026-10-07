import { describe, expect, it } from 'vitest';
import {
	EMPTY_DOCUMENTO_LINE,
	parseDocumentosCompraFilters,
	purchaseDocumentFormSchema,
	serializeDocumentosCompraFilters,
} from '../types';
import type { IDocumentosCompraFilters, IPurchaseDocumentFormValues } from '../types';

/**
 * La factura exige proveedor y la boleta lo permite `null`. El costo unitario
 * reutiliza `costEntrySchema`: estas pruebas verifican que ese reuso ata monto
 * y base a cada línea.
 */

const validLine = {
	product_id: 31,
	quantity: '2',
	unit_cost: '5000.00',
	unit_cost_basis: 'gross' as const,
	notes: '',
};

const baseValues: IPurchaseDocumentFormValues = {
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

describe('purchaseDocumentFormSchema', () => {
	it('la boleta es válida sin proveedor', async () => {
		await expect(purchaseDocumentFormSchema.validate(baseValues)).resolves.toBeTruthy();
	});

	it('la factura sin proveedor es inválida', async () => {
		await expect(
			purchaseDocumentFormSchema.validate({ ...baseValues, document_type: 'invoice' }),
		).rejects.toThrow(/proveedor/i);
	});

	it('la factura con proveedor es válida', async () => {
		await expect(
			purchaseDocumentFormSchema.validate({
				...baseValues,
				document_type: 'invoice',
				supplier_id: 7,
			}),
		).resolves.toBeTruthy();
	});

	it('exige folio y fecha de emisión', async () => {
		await expect(
			purchaseDocumentFormSchema.validate({ ...baseValues, document_number: '' }),
		).rejects.toThrow(/folio/i);
		await expect(
			purchaseDocumentFormSchema.validate({ ...baseValues, issue_date: '' }),
		).rejects.toThrow(/emisión/i);
	});

	it('exige al menos una línea', async () => {
		await expect(
			purchaseDocumentFormSchema.validate({ ...baseValues, items: [] }),
		).rejects.toThrow(/línea/i);
	});

	it('cada línea exige producto, cantidad positiva, costo y base', async () => {
		await expect(
			purchaseDocumentFormSchema.validate({
				...baseValues,
				items: [{ ...EMPTY_DOCUMENTO_LINE }],
			}),
		).rejects.toThrow();

		await expect(
			purchaseDocumentFormSchema.validate({
				...baseValues,
				items: [{ ...validLine, quantity: '0' }],
			}),
		).rejects.toThrow(/mayor que cero/i);

		await expect(
			purchaseDocumentFormSchema.validate({
				...baseValues,
				items: [{ ...validLine, unit_cost: '', unit_cost_basis: '' }],
			}),
		).rejects.toThrow();
	});
});

const DEFAULT_FILTERS: IDocumentosCompraFilters = {
	search: '',
	documentType: 'all',
	status: 'all',
	receptionStatus: 'all',
	supplierId: null,
	issuedFrom: '',
	issuedTo: '',
	page: 1,
	perPage: 20,
};

describe('Filtros del listado en la URL', () => {
	it('sin parámetros son los valores por defecto y no escriben nada', () => {
		const filters = parseDocumentosCompraFilters(new URLSearchParams());
		expect(filters).toEqual(DEFAULT_FILTERS);
		expect(serializeDocumentosCompraFilters(filters).toString()).toBe('');
	});

	it('ida y vuelta conserva todos los filtros con las claves del contrato', () => {
		const filters: IDocumentosCompraFilters = {
			search: 'PCExpress',
			documentType: 'invoice',
			status: 'confirmed',
			receptionStatus: 'partially_received',
			supplierId: 3,
			issuedFrom: '2026-09-01',
			issuedTo: '2026-09-30',
			page: 2,
			perPage: 50,
		};
		const params = serializeDocumentosCompraFilters(filters);
		expect(params.toString()).toBe(
			'search=PCExpress&document_type=invoice&status=confirmed&reception_status=partially_received&supplier_id=3&issued_from=2026-09-01&issued_to=2026-09-30&page=2&per_page=50',
		);
		expect(parseDocumentosCompraFilters(params)).toEqual(filters);
	});

	it('valores desconocidos o mal formados caen al valor por defecto', () => {
		const filters = parseDocumentosCompraFilters(
			new URLSearchParams(
				'document_type=nota&status=all&reception_status=x&supplier_id=abc&issued_from=2026-02-30&page=0&per_page=500',
			),
		);
		expect(filters).toEqual(DEFAULT_FILTERS);
	});
});
