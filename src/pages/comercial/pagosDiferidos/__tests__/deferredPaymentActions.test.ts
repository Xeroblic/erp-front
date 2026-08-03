import { describe, expect, it } from 'vitest';
import { createDeferredPaymentActionSchema } from '../types';

describe('ZF-8 validación de abonos', () => {
	const valid = {
		amount: '50000',
		paid_at: '2026-08-03',
		method: 'transfer',
		notes: '',
		receipt: null,
	};
	it('acepta monto parcial y exacto, los cinco métodos y nota opcional', async () => {
		const schema = createDeferredPaymentActionSchema(100000);
		await expect(schema.validate(valid)).resolves.toBeTruthy();
		await expect(
			schema.validate({
				...valid,
				amount: '100000',
				notes: '  referencia  ',
				method: 'other',
			}),
		).resolves.toBeTruthy();
		for (const method of ['transfer', 'deposit', 'check', 'cash', 'other'])
			await expect(schema.validate({ ...valid, method })).resolves.toBeTruthy();
	});
	it.each([
		['', 'Ingresa el monto'],
		['0', 'El monto debe ser mayor a 0'],
		['-1', 'El monto debe ser mayor a 0'],
		['texto', 'El monto debe ser un número'],
		['100001', 'El abono excede el saldo pendiente del documento.'],
	])('rechaza monto %s', async (amount, message) => {
		await expect(
			createDeferredPaymentActionSchema(100000).validate({ ...valid, amount }),
		).rejects.toThrow(message);
	});
	it('exige fecha y método', async () => {
		const schema = createDeferredPaymentActionSchema(100000);
		await expect(schema.validate({ ...valid, paid_at: '' })).rejects.toThrow(
			'Selecciona la fecha del abono',
		);
		await expect(schema.validate({ ...valid, method: 'invalid' })).rejects.toThrow(
			'Selecciona un método válido',
		);
	});
	it('rechaza comprobantes mayores a 10 MB o con MIME no permitido', async () => {
		const schema = createDeferredPaymentActionSchema(100000);
		await expect(
			schema.validate({
				...valid,
				receipt: new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', {
					type: 'application/pdf',
				}),
			}),
		).rejects.toThrow('10 MB');
		await expect(
			schema.validate({
				...valid,
				receipt: new File(['x'], 'archivo.txt', { type: 'text/plain' }),
			}),
		).rejects.toThrow('Formato de comprobante no permitido');
	});
});
