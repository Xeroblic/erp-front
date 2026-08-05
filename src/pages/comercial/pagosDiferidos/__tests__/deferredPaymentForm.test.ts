import { describe, expect, it } from 'vitest';
import {
	calculateDeferredPaymentEstimatedTotal,
	createDeferredPaymentInitialValues,
	DeferredPaymentDocumentSchema,
} from '../types';

const validValues = {
	...createDeferredPaymentInitialValues('2026-07-28'),
	customer_sale_id: 15,
	document_number: 'FD-TEST-001',
	due_date: '2026-08-27',
	items: [
		{
			client_key: 'test-item-1',
			product_id: null,
			code: 'SERV-001',
			description: 'Servicio mensual',
			quantity: 2,
			unit_price: 150000,
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

	it('permite ítems gratuitos cuando el total del documento es positivo', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				items: [
					{ ...validValues.items[0], unit_price: 0 },
					{ ...validValues.items[0], client_key: 'test-item-2', unit_price: 1000 },
				],
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
	it('explica en español cuando el total completo es cero', async () => {
		await expect(
			DeferredPaymentDocumentSchema.validate({
				...validValues,
				items: [{ ...validValues.items[0], unit_price: 0 }],
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
});
