import { describe, expect, it } from 'vitest';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';

const FALLBACK = 'No se pudo completar la operación';
const CONTEXTUAL_403 = 'no tienes acceso a esta subsidiaria';

const forbidden = (data: unknown) => ({ response: { status: 403, data } });

describe('getDeferredPaymentErrorMessage', () => {
	it('usa el mensaje contextual en un 403 sin cuerpo', () => {
		expect(getDeferredPaymentErrorMessage(forbidden({}), FALLBACK)).toContain(CONTEXTUAL_403);
	});

	it.each([
		'Forbidden',
		'This action is unauthorized.',
		'Unauthorized',
		'User does not have the right permissions.',
		'Acceso denegado',
		'  no autorizado  ',
		'Esta acción no está autorizada',
	])('reemplaza el mensaje genérico "%s" de un 403', (message) => {
		expect(getDeferredPaymentErrorMessage(forbidden({ message }), FALLBACK)).toContain(
			CONTEXTUAL_403,
		);
	});

	it('conserva el mensaje de negocio de un 403 cuando es específico', () => {
		const message = 'El documento tiene abonos registrados y no puede eliminarse.';
		expect(getDeferredPaymentErrorMessage(forbidden({ message }), FALLBACK)).toBe(message);
	});

	it('conserva el mensaje del backend en errores que no son 403', () => {
		const error = { response: { status: 422, data: { message: 'RUT duplicado' } } };
		expect(getDeferredPaymentErrorMessage(error, FALLBACK)).toBe('RUT duplicado');
	});

	it('devuelve el string plano de un rejectWithValue normalizado', () => {
		expect(getDeferredPaymentErrorMessage('Ya normalizado', FALLBACK)).toBe('Ya normalizado');
	});

	it('cae al mensaje de la excepción y luego al fallback', () => {
		expect(getDeferredPaymentErrorMessage(new Error('Sin red'), FALLBACK)).toBe('Sin red');
		expect(getDeferredPaymentErrorMessage(null, FALLBACK)).toBe(FALLBACK);
	});
});
