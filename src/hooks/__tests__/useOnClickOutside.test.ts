import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { RefObject } from 'react';
import useOnClickOutside from '../useOnClickOutside';

/** Construye un RefObject no-null a partir de un elemento (o null). */
const refTo = <T extends HTMLElement>(el: T | null): RefObject<T> =>
	({ current: el }) as RefObject<T>;

describe('useOnClickOutside', () => {
	let container: HTMLDivElement;
	let outside: HTMLDivElement;

	beforeEach(() => {
		container = document.createElement('div');
		outside = document.createElement('div');
		document.body.appendChild(container);
		document.body.appendChild(outside);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('invoca el handler al hacer click fuera del elemento', () => {
		const handler = vi.fn();

		renderHook(() => useOnClickOutside(refTo(container), handler));
		outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('NO invoca el handler al hacer click dentro del elemento', () => {
		const handler = vi.fn();

		renderHook(() => useOnClickOutside(refTo(container), handler));
		container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

		expect(handler).not.toHaveBeenCalled();
	});

	it('NO invoca el handler cuando el click es en un descendiente', () => {
		const child = document.createElement('span');
		container.appendChild(child);
		const handler = vi.fn();

		renderHook(() => useOnClickOutside(refTo(container), handler));
		child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

		expect(handler).not.toHaveBeenCalled();
	});

	it('no hace nada si el ref es null', () => {
		const handler = vi.fn();

		renderHook(() => useOnClickOutside(refTo<HTMLDivElement>(null), handler));
		outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

		expect(handler).not.toHaveBeenCalled();
	});

	it('respeta el tipo de evento configurado (mouseup)', () => {
		const handler = vi.fn();

		renderHook(() => useOnClickOutside(refTo(container), handler, 'mouseup'));
		outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		expect(handler).not.toHaveBeenCalled();

		outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
		expect(handler).toHaveBeenCalledTimes(1);
	});
});
