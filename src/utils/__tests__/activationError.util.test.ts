import { describe, it, expect } from 'vitest';
import {
	resolveActivationError,
	GENERIC_ACTIVATION_ERROR,
	NETWORK_ACTIVATION_ERROR,
	SERVER_ACTIVATION_ERROR,
} from '@/utils/activationError.util';

describe('resolveActivationError', () => {
	it('404 devuelve el mensaje de enlace inválido', () => {
		const message = resolveActivationError({
			response: { status: 404, data: { message: 'Invalid token' } },
		});
		expect(message).toContain('no es válido');
		expect(message).not.toContain('Invalid token');
	});

	it('410 indica que la invitación ya fue utilizada o expiró', () => {
		const message = resolveActivationError({
			response: { status: 410, data: { message: 'Invitation no longer valid' } },
		});
		expect(message).toContain('ya fue utilizada o expiró');
	});

	it('422 prioriza el error de validación del campo', () => {
		const message = resolveActivationError({
			response: {
				status: 422,
				data: { errors: { password: ['La contraseña es demasiado corta'] } },
			},
		});
		expect(message).toBe('La contraseña es demasiado corta');
	});

	it('422 sin detalle de campo cae al mensaje genérico de validación', () => {
		const message = resolveActivationError({ response: { status: 422, data: {} } });
		expect(message).toContain('no son válidos');
	});

	it('5xx nunca expone el mensaje crudo del servidor', () => {
		const message = resolveActivationError({
			response: {
				status: 500,
				data: {
					message:
						'Object of class App\\Enums\\InvitationStatus could not be converted to string',
				},
			},
		});
		expect(message).toBe(SERVER_ACTIVATION_ERROR);
		expect(message).not.toContain('App\\Enums');
	});

	it('sin respuesta del servidor devuelve el mensaje de red', () => {
		expect(resolveActivationError({ message: 'Network Error' })).toBe(
			NETWORK_ACTIVATION_ERROR,
		);
	});

	it('valores no-objeto devuelven el mensaje genérico', () => {
		expect(resolveActivationError(null)).toBe(GENERIC_ACTIVATION_ERROR);
		expect(resolveActivationError('boom')).toBe(GENERIC_ACTIVATION_ERROR);
	});

	it('usa detail/message del backend en 4xx no mapeados', () => {
		const message = resolveActivationError({
			response: { status: 409, data: { detail: 'La sucursal ya no existe' } },
		});
		expect(message).toBe('La sucursal ya no existe');
	});
});
