import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import usePollingWhile, { type IUsePollingWhileOptions } from '@/hooks/usePollingWhile';

const setVisibility = (state: DocumentVisibilityState) => {
	Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
	document.dispatchEvent(new Event('visibilitychange'));
};

/** Avanza el reloj y deja resolver las promesas de la consulta. */
const advance = async (ms: number) => {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
};

const renderPolling = (initial: Partial<IUsePollingWhileOptions> = {}) => {
	const poll = vi.fn().mockResolvedValue(undefined);
	const utils = renderHook((props: IUsePollingWhileOptions) => usePollingWhile(props), {
		initialProps: { active: true, poll, resetKey: 'a', ...initial },
	});
	return { poll, ...utils };
};

describe('usePollingWhile', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		setVisibility('visible');
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('espacia las consultas 1,5 s → 3 s → 6 s → 12 s y no pasa de 15 s', async () => {
		const { poll } = renderPolling();

		const expectCallsAfter = async (ms: number, calls: number) => {
			await advance(ms - 1);
			expect(poll).toHaveBeenCalledTimes(calls - 1);
			await advance(1);
			expect(poll).toHaveBeenCalledTimes(calls);
		};

		await expectCallsAfter(1500, 1);
		await expectCallsAfter(3000, 2);
		await expectCallsAfter(6000, 3);
		await expectCallsAfter(12_000, 4);
		await expectCallsAfter(15_000, 5);
		await expectCallsAfter(15_000, 6);
	});

	it('no solapa consultas: la siguiente espera a que termine la anterior', async () => {
		let finish: () => void = () => undefined;
		const poll = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				}),
		);
		renderPolling({ poll });

		await advance(1500);
		expect(poll).toHaveBeenCalledTimes(1);

		// La respuesta tarda mucho más que cualquier espera: nada nuevo sale.
		await advance(60_000);
		expect(poll).toHaveBeenCalledTimes(1);

		await act(async () => {
			finish();
			await Promise.resolve();
		});
		await advance(3000);
		expect(poll).toHaveBeenCalledTimes(2);
	});

	it('vence justo en el tope, sin una consulta más, y resume() vuelve a empezar', async () => {
		const { poll, result } = renderPolling({ maxDurationMs: 30_000 });

		// 1,5 + 3 + 6 + 12 = 22,5 s; la siguiente (15 s) caería a los 37,5 s, pasado el tope.
		await advance(22_500);
		expect(poll).toHaveBeenCalledTimes(4);

		await advance(7499);
		expect(result.current.isExhausted).toBe(false);
		await advance(1);
		expect(result.current.isExhausted).toBe(true);

		await advance(120_000);
		expect(poll).toHaveBeenCalledTimes(4);

		await act(async () => {
			result.current.resume();
			await Promise.resolve();
		});
		expect(poll).toHaveBeenCalledTimes(5);
		expect(result.current.isExhausted).toBe(false);

		// Reinició la espera: la siguiente vuelve a ser a 3 s, no a 15 s.
		await advance(3000);
		expect(poll).toHaveBeenCalledTimes(6);
	});

	it('vence aunque la consulta en curso no responda, y resume() no la solapa', async () => {
		let finish: () => void = () => undefined;
		const hanging = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				}),
		);
		const { result } = renderPolling({ poll: hanging, maxDurationMs: 30_000 });

		await advance(1500);
		expect(hanging).toHaveBeenCalledTimes(1);

		await advance(28_500);
		expect(result.current.isExhausted).toBe(true);

		// «Actualizar» con la consulta anterior todavía colgada: se espera su
		// respuesta en vez de lanzar otra encima.
		await act(async () => {
			result.current.resume();
			await Promise.resolve();
		});
		expect(result.current.isExhausted).toBe(false);
		expect(hanging).toHaveBeenCalledTimes(1);

		await act(async () => {
			finish();
			await Promise.resolve();
		});
		await advance(3000);
		expect(hanging).toHaveBeenCalledTimes(2);
	});

	it('pausa con la pestaña oculta y al volver consulta una vez enseguida', async () => {
		const { poll } = renderPolling();

		await advance(1500);
		expect(poll).toHaveBeenCalledTimes(1);

		act(() => setVisibility('hidden'));
		await advance(60_000);
		expect(poll).toHaveBeenCalledTimes(1);

		await act(async () => {
			setVisibility('visible');
			await Promise.resolve();
		});
		expect(poll).toHaveBeenCalledTimes(2);

		// Sigue con la espera que llevaba (3 s → 6 s).
		await advance(5999);
		expect(poll).toHaveBeenCalledTimes(2);
		await advance(1);
		expect(poll).toHaveBeenCalledTimes(3);
	});

	it('deja de consultar en cuanto active pasa a false', async () => {
		const { poll, rerender } = renderPolling();

		await advance(1500);
		rerender({ active: false, poll, resetKey: 'a' });
		await advance(60_000);

		expect(poll).toHaveBeenCalledTimes(1);
	});

	it('al cambiar de recurso descarta la respuesta tardía y reinicia la espera', async () => {
		let finish: () => void = () => undefined;
		const slow = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					finish = resolve;
				}),
		);
		const { rerender } = renderPolling({ poll: slow, resetKey: 'recepcion-1' });
		await advance(1500);
		expect(slow).toHaveBeenCalledTimes(1);

		const next = vi.fn().mockResolvedValue(undefined);
		rerender({ active: true, poll: next, resetKey: 'recepcion-2' });

		// La consulta de la recepción 1 termina tarde: no programa nada.
		await act(async () => {
			finish();
			await Promise.resolve();
		});
		await advance(1499);
		expect(slow).toHaveBeenCalledTimes(1);
		expect(next).not.toHaveBeenCalled();

		// La recepción 2 arranca con la espera inicial, no con la acumulada.
		await advance(1);
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('se limpia al desmontar', async () => {
		const { poll, unmount } = renderPolling();

		await advance(1500);
		unmount();
		await advance(60_000);
		act(() => setVisibility('hidden'));
		act(() => setVisibility('visible'));

		expect(poll).toHaveBeenCalledTimes(1);
	});
});
