import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';

/** Cabeceras con las que se llamó al escritor en la tentativa `index`. */
const headersOf = (write: Mock, index: number): Record<string, string> =>
	(write.mock.calls as unknown as Record<string, string>[][])[index][0];

const timeoutError = { isAxiosError: true, code: 'ECONNABORTED', request: {} };
const validationError = {
	isAxiosError: true,
	response: { status: 422, data: { message: 'Falta el costo.', code: 'UNIT_COST_REQUIRED' } },
};

describe('useIdempotentWrite', () => {
	it('entrega Idempotency-Key y, con ETag, If-Match', async () => {
		const write = vi.fn().mockResolvedValue('ok');
		const { result } = renderHook(() => useIdempotentWrite({ etag: 'W/"7"' }));

		await act(async () => {
			await result.current.submit(write);
		});

		expect(write).toHaveBeenCalledWith(expect.objectContaining({ 'If-Match': 'W/"7"' }));
		expect(headersOf(write, 0)['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/i);
	});

	it('reusa la misma clave al reintentar un timeout', async () => {
		// La regla del contrato: no generar otra clave al reintentar por timeout.
		// Generarla convertiría el reintento en una segunda recepción.
		const write = vi.fn().mockRejectedValueOnce(timeoutError).mockResolvedValueOnce('ok');
		const { result } = renderHook(() => useIdempotentWrite());

		await act(async () => {
			await result.current.submit(write);
		});

		await waitFor(() => expect(result.current.canRetry).toBe(true));

		// El mensaje que ve la pantalla y la decisión de reintento tienen que
		// coincidir: «reintenta sin cambiar los datos» y `canRetry`, no
		// «corrige los datos» —que implicaría clave nueva— junto a `canRetry`.
		expect(result.current.error?.action).toBe('retry_same_key');
		expect(result.current.error?.code).toBe('TRANSPORT_FAILURE');

		await act(async () => {
			await result.current.submit(write);
		});

		expect(headersOf(write, 0)['Idempotency-Key']).toBe(headersOf(write, 1)['Idempotency-Key']);
	});

	it('conserva la clave tras un error definitivo hasta que se corrige el payload', async () => {
		const write = vi.fn().mockRejectedValue(validationError);
		const { result } = renderHook(() => useIdempotentWrite());

		await act(async () => {
			await result.current.submit(write);
		});

		await waitFor(() => expect(result.current.error?.code).toBe('UNIT_COST_REQUIRED'));
		// Error definitivo: la instrucción es corregir, y por eso no se reintenta.
		expect(result.current.error?.action).toBe('fix_input');
		expect(result.current.canRetry).toBe(false);

		const keyBefore = result.current.idempotencyKey;

		// Sólo al corregir el payload se pide clave nueva: con la anterior el
		// backend responde 409 IDEMPOTENCY_KEY_REUSED.
		act(() => {
			result.current.renewKey();
		});

		expect(result.current.idempotencyKey).not.toBe(keyBefore);
		expect(result.current.error).toBeNull();
	});

	it('renueva la clave tras una escritura exitosa', async () => {
		const write = vi.fn().mockResolvedValue('ok');
		const { result } = renderHook(() => useIdempotentWrite());
		const keyBefore = result.current.idempotencyKey;

		await act(async () => {
			await result.current.submit(write);
		});

		await waitFor(() => expect(result.current.idempotencyKey).not.toBe(keyBefore));
	});

	it('onError entrega el resuelto del intento actual, no un cierre de un render anterior', async () => {
		// Hallazgo 7 (revisión ZF-110): un consumidor que lee `result.current.error`
		// después de un `await submit(...)` capturado en un cierre viejo ve el
		// valor de ANTES del envío, no el que este intento acaba de producir.
		// `onError` existe para entregarlo sin ese desfase — se llama dentro del
		// mismo `catch` que fija `error`, así que nunca puede ir un intento
		// detrás como podía pasar leyendo el objeto del hook tras el `await`.
		const write = vi
			.fn()
			.mockRejectedValueOnce(validationError)
			.mockRejectedValueOnce({
				isAxiosError: true,
				response: { status: 422, data: { message: 'Otro error.', code: 'OTHER_FIELD' } },
			});
		const { result } = renderHook(() => useIdempotentWrite());

		const seen: string[] = [];
		await act(async () => {
			await result.current.submit(write, {
				onError: (error) => seen.push(error.code),
			});
		});
		await act(async () => {
			await result.current.submit(write, {
				onError: (error) => seen.push(error.code),
			});
		});

		expect(seen).toEqual(['UNIT_COST_REQUIRED', 'OTHER_FIELD']);
	});

	it('ignora el segundo submit mientras hay uno en curso', async () => {
		let release: (value: string) => void = () => undefined;
		const write = vi.fn(
			() =>
				new Promise<string>((resolve) => {
					release = resolve;
				}),
		);
		const { result } = renderHook(() => useIdempotentWrite());

		let firstCall: Promise<string | undefined> = Promise.resolve(undefined);
		act(() => {
			firstCall = result.current.submit(write);
		});

		await waitFor(() => expect(result.current.isSubmitting).toBe(true));

		await act(async () => {
			// Doble clic: sería idempotente en el backend, pero devolvería
			// 409 OPERATION_IN_PROGRESS y mostraría un error que nadie provocó.
			await result.current.submit(write);
		});

		expect(write).toHaveBeenCalledTimes(1);

		await act(async () => {
			release('ok');
			await firstCall;
		});
	});
});
