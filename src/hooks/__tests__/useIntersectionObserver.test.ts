import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { RefObject } from 'react';
import useIntersectionObserver from '../useIntersectionObserver';

/** Construye un RefObject no-null a partir de un elemento (o null). */
const refTo = <T extends HTMLElement>(el: T | null): RefObject<T> =>
	({ current: el }) as RefObject<T>;

describe('useIntersectionObserver', () => {
	let observe: ReturnType<typeof vi.fn>;
	let disconnect: ReturnType<typeof vi.fn>;
	let lastCallback: (entries: Array<{ isIntersecting: boolean }>) => void;

	beforeEach(() => {
		observe = vi.fn();
		disconnect = vi.fn();
		class MockIO {
			constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
				lastCallback = cb;
			}

			observe = observe;

			unobserve = () => {};

			disconnect = disconnect;
		}
		vi.stubGlobal('IntersectionObserver', MockIO as unknown as typeof IntersectionObserver);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('inicia con isInView en false', () => {
		const ref = refTo<HTMLDivElement>(null);
		const { result } = renderHook(() => useIntersectionObserver(ref));
		expect(result.current[0]).toBe(false);
	});

	it('observa el elemento del ref cuando existe', () => {
		const el = document.createElement('div');
		const ref = refTo(el);

		renderHook(() => useIntersectionObserver(ref));
		expect(observe).toHaveBeenCalledWith(el);
	});

	it('no observa cuando el ref es null', () => {
		const ref = refTo<HTMLDivElement>(null);
		renderHook(() => useIntersectionObserver(ref));
		expect(observe).not.toHaveBeenCalled();
	});

	it('actualiza isInView cuando el observer reporta intersección', () => {
		const el = document.createElement('div');
		const ref = refTo(el);

		const { result } = renderHook(() => useIntersectionObserver(ref));
		act(() => lastCallback([{ isIntersecting: true }]));
		expect(result.current[0]).toBe(true);

		act(() => lastCallback([{ isIntersecting: false }]));
		expect(result.current[0]).toBe(false);
	});

	it('desconecta el observer al desmontar', () => {
		const ref = refTo<HTMLDivElement>(null);
		const { unmount } = renderHook(() => useIntersectionObserver(ref));
		unmount();
		expect(disconnect).toHaveBeenCalled();
	});
});
