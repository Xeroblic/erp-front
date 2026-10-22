import { describe, expect, it } from 'vitest';
import {
	LOCKER_FORBIDDEN_MESSAGE,
	LOCKER_RATE_LIMITED_MESSAGE,
	LOCKER_SERVER_ERROR_MESSAGE,
	resolveLockerError,
} from '@/utils/lockerErrors.util';

const axiosError = (status: number, data: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

const FALLBACK = 'No se pudo completar la acción.';

describe('resolveLockerError', () => {
	it('reemplaza el 429 de Laravel en inglés por el mensaje de espera en español', () => {
		const resolved = resolveLockerError(
			axiosError(429, { message: 'Too Many Attempts.' }),
			FALLBACK,
		);

		expect(resolved).toEqual({
			status: 429,
			kind: 'rate_limited',
			message: LOCKER_RATE_LIMITED_MESSAGE,
		});
	});

	it('usa el mensaje propio en un 403, que también cubre un id inexistente', () => {
		const resolved = resolveLockerError(
			axiosError(403, { message: 'This action is unauthorized.' }),
			FALLBACK,
		);

		expect(resolved.kind).toBe('forbidden');
		expect(resolved.message).toBe(LOCKER_FORBIDDEN_MESSAGE);
	});

	it('conserva el mensaje de negocio del backend en un 422', () => {
		const resolved = resolveLockerError(
			axiosError(422, { message: 'La palabra clave de retiro no es válida.' }),
			FALLBACK,
		);

		expect(resolved.kind).toBe('business');
		expect(resolved.message).toBe('La palabra clave de retiro no es válida.');
	});

	it('conserva el mensaje de negocio del backend en un 400 de una acción del técnico', () => {
		const resolved = resolveLockerError(
			axiosError(400, { message: 'Solo se pueden resetear casilleros en cuarentena.' }),
			FALLBACK,
		);

		expect(resolved.kind).toBe('business');
		expect(resolved.message).toBe('Solo se pueden resetear casilleros en cuarentena.');
	});

	it('no muestra el cuerpo de un 500', () => {
		const resolved = resolveLockerError(
			axiosError(500, { message: 'SQLSTATE[23000]: Integrity constraint violation' }),
			FALLBACK,
		);

		expect(resolved.kind).toBe('server');
		expect(resolved.message).toBe(LOCKER_SERVER_ERROR_MESSAGE);
	});

	it('usa el fallback cuando la respuesta no trae mensaje', () => {
		const resolved = resolveLockerError(axiosError(404, {}), FALLBACK);

		expect(resolved.kind).toBe('not_found');
		expect(resolved.message).toBe(FALLBACK);
	});
});
