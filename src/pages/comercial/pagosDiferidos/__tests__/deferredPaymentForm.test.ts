import { describe, expect, it } from 'vitest';
import {
	calculateDeferredPaymentGrossUnitPrice,
	calculateDeferredPaymentEstimatedTotal,
	calculateDeferredPaymentVatBreakdown,
	createDeferredPaymentInitialValues,
	DeferredPaymentDocumentSchema,
} from '../types';
import { formatCLP } from '@/utils/format.utils';
import { formatDeferredPaymentInputAmount, parseDeferredPaymentAmount } from '../utils';

const validValues = {
	...createDeferredPaymentInitialValues('2026-07-28'),
	customer_sale_id: 15,
	document_number: 'FD-TEST-001',
	due_date: '2026-08-27',
	total_amount: 300000,
	items: [
		{
			client_key: 'test-item-1',
			product_id: null,
			code: 'SERV-001',
			description: 'Servicio mensual',
			quantity: 2,
			unit_price: 150000,
			entered_unit_price: 150000,
			calculates_vat: true,
			serials: [],
		},
	],
};

describe('ZF-7 formulario de pago diferido', () => {
	it('acepta un documento completo con al menos un ítem', async () => {
		await expect(DeferredPaymentDocumentSchema.validate(validValues)).resolves.toMatchObject({
			customer_sale_id: 15,
			document_number: 'FD-TEST-001',
		});
	});

	it('rechaza un documento sin ítems', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({ ...validValues, items: [] }),
		).rejects.toThrow('Agrega al menos un ítem al documento');
	});

	it('rechaza una fecha de vencimiento anterior a la emisión', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				due_date: '2026-07-27',
			}),
		).rejects.toThrow('La fecha de vencimiento no puede ser anterior a la fecha de emisión');
	});

	it('rechaza cantidades no positivas', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate(
				{
					...validValues,
					items: [{ ...validValues.items[0], quantity: 0, unit_price: 0 }],
				},
				{ abortEarly: false },
			),
		).rejects.toMatchObject({
			errors: expect.arrayContaining(['La cantidad debe ser mayor a 0']),
		});
	});

	it('no valida la orden de compra cuando está vacía o ausente', async () => {
		const values = createDeferredPaymentInitialValues('2026-07-31');
		const validDocument = {
			...values,
			customer_sale_id: 1,
			document_number: 'FD-SIN-OC',
			total_amount: 1000,
			items: [
				{
					...values.items[0],
					code: 'SERV',
					description: 'Servicio sin orden de compra',
					quantity: 1,
					unit_price: 1000,
				},
			],
		};

		await expect(
			DeferredPaymentDocumentSchema.validate({ ...validDocument, purchase_order: '' }),
		).resolves.toBeDefined();
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validDocument,
				purchase_order: undefined,
			}),
		).resolves.toBeDefined();
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validDocument,
				purchase_order: 'OC-'.padEnd(101, 'X'),
			}),
		).rejects.toThrow('La orden de compra no puede superar los 100 caracteres');
	});

	it('acepta textos opcionales vacíos y exige un arreglo de seriales', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				purchase_order: '   ',
				notes: undefined,
			}),
		).resolves.toBeDefined();

		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				items: [{ ...validValues.items[0], serials: undefined }],
			}),
		).rejects.toThrow('items[0].serials must be defined');
	});

	it('permite ítems con precio cero cuando el total oficial del documento es positivo', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				items: [{ ...validValues.items[0], unit_price: 0 }],
			}),
		).resolves.toBeDefined();
	});

	it('rechaza precios unitarios negativos', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				items: [
					{ ...validValues.items[0], unit_price: -1 },
					{ ...validValues.items[0], client_key: 'test-item-2', unit_price: 1000 },
				],
			}),
		).rejects.toThrow('El precio unitario no puede ser negativo');
	});
	it('explica en español cuando el total oficial del documento es cero', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				total_amount: 0,
			}),
		).rejects.toThrow('El total del documento debe ser mayor a 0');
	});
	it('calcula el total estimado sin modificar los ítems', () => {
		const items = [
			{ ...validValues.items[0], quantity: 2, unit_price: 150000 },
			{ ...validValues.items[0], quantity: 3, unit_price: 50000 },
		];

		expect(calculateDeferredPaymentEstimatedTotal(items)).toBe(450000);
	});

	it('calcula el bruto con IVA al 19% y conserva el valor bruto ingresado', () => {
		expect(calculateDeferredPaymentGrossUnitPrice(100, true)).toBe(119);
		expect(calculateDeferredPaymentGrossUnitPrice(50411.76, true)).toBe(59989.99);
		expect(calculateDeferredPaymentGrossUnitPrice(100, false)).toBe(100);
		expect(calculateDeferredPaymentGrossUnitPrice('', true)).toBeNull();
	});

	it('deriva el desglose referencial desde el total oficial y conserva la suma exacta', () => {
		expect(calculateDeferredPaymentVatBreakdown(299950)).toEqual({
			net_amount: 252059,
			vat_amount: 47891,
		});
		expect(calculateDeferredPaymentVatBreakdown(0)).toBeNull();
		expect(calculateDeferredPaymentVatBreakdown(100.49)).toEqual({
			net_amount: 84,
			vat_amount: 16.49,
		});
	});

	it('normaliza importes es-CL con separador de miles y hasta dos decimales', () => {
		expect(parseDeferredPaymentAmount('$ 50.411,76')).toBe('50411.76');
		expect(parseDeferredPaymentAmount('50.411,768')).toBe('50411.76');
		expect(parseDeferredPaymentAmount('50411.76')).toBe('50411.76');
		expect(parseDeferredPaymentAmount('1.234.567')).toBe('1234567');
		expect(parseDeferredPaymentAmount('1.234')).toBe('1234');
		expect(formatDeferredPaymentInputAmount('50.')).toBe('$ 50,');
		expect(formatDeferredPaymentInputAmount('50.4')).toBe('$ 50,4');
		expect(formatDeferredPaymentInputAmount('50.41')).toBe('$ 50,41');
	});

	it('preserva los decimales significativos solicitados al formatear moneda', () => {
		expect(formatCLP(1234.5, 2)).toBe('$ 1.234,50');
		expect(formatCLP(59989.9, 2)).toBe('$ 59.989,90');
		expect(formatCLP(1234, 2)).toBe('$ 1.234');
	});
});
