import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { RefObject } from 'react';
import useEventListener from '../useEventListener';

/** Construye un RefObject no-null a partir de un elemento. */
const refTo = <T extends HTMLElement>(el: T | null): RefObject<T> =>
	({ current: el }) as RefObject<T>;

describe('useEventListener', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('escucha eventos de window por defecto', () => {
		const handler = vi.fn();
		renderHook(() => useEventListener('resize', handler));

		window.dispatchEvent(new Event('resize'));
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('adjunta el listener al elemento del ref cuando se provee', () => {
		const el = document.createElement('div');
		document.body.appendChild(el);
		const ref = refTo(el);
		const handler = vi.fn();

		renderHook(() => useEventListener('click', handler, ref));
		el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('remueve el listener al desmontar', () => {
		const handler = vi.fn();
		const { unmount } = renderHook(() => useEventListener('resize', handler));

		unmount();
		window.dispatchEvent(new Event('resize'));
		expect(handler).not.toHaveBeenCalled();
	});

	it('usa siempre el último handler sin re-adjuntar el listener', () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = renderHook(({ h }) => useEventListener('resize', h), {
			initialProps: { h: first },
		});

		rerender({ h: second });
		window.dispatchEvent(new Event('resize'));

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('pasa el objeto de evento al handler', () => {
		const handler = vi.fn();
		renderHook(() => useEventListener('resize', handler));

		const evt = new Event('resize');
		window.dispatchEvent(evt);
		expect(handler).toHaveBeenCalledWith(evt);
	});
});
