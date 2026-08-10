import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// jsdom en este entorno no expone Storage; proveemos un polyfill en memoria
// para que hooks/servicios que usan window.localStorage funcionen en tests.
class MemoryStorage implements Storage {
	private store = new Map<string, string>();

	get length(): number {
		return this.store.size;
	}

	clear(): void {
		this.store.clear();
	}

	getItem(key: string): string | null {
		return this.store.has(key) ? (this.store.get(key) as string) : null;
	}

	key(index: number): string | null {
		return Array.from(this.store.keys())[index] ?? null;
	}

	removeItem(key: string): void {
		this.store.delete(key);
	}

	setItem(key: string, value: string): void {
		this.store.set(key, String(value));
	}
}

if (
	typeof window !== 'undefined' &&
	(typeof window.localStorage?.getItem !== 'function' ||
		typeof window.localStorage?.clear !== 'function')
) {
	Object.defineProperty(window, 'localStorage', {
		value: new MemoryStorage(),
		writable: true,
		configurable: true,
	});
}

if (
	typeof window !== 'undefined' &&
	(typeof window.sessionStorage?.getItem !== 'function' ||
		typeof window.sessionStorage?.clear !== 'function')
) {
	Object.defineProperty(window, 'sessionStorage', {
		value: new MemoryStorage(),
		writable: true,
		configurable: true,
	});
}

// jsdom no implementa matchMedia; devolvemos un stub inerte (no-match) para que
// hooks que consultan media queries no revienten en tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
		value: (query: string): MediaQueryList => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}),
	});
}

// jsdom no implementa IntersectionObserver ni ResizeObserver; stubs no-op.
if (typeof globalThis !== 'undefined' && !('IntersectionObserver' in globalThis)) {
	class IntersectionObserverStub {
		observe = () => {};

		unobserve = () => {};

		disconnect = () => {};

		takeRecords = () => [];

		root = null;

		rootMargin = '';

		thresholds = [];
	}
	Object.defineProperty(globalThis, 'IntersectionObserver', {
		writable: true,
		configurable: true,
		value: IntersectionObserverStub,
	});
}

if (typeof globalThis !== 'undefined' && !('ResizeObserver' in globalThis)) {
	class ResizeObserverStub {
		observe = () => {};

		unobserve = () => {};

		disconnect = () => {};
	}
	Object.defineProperty(globalThis, 'ResizeObserver', {
		writable: true,
		configurable: true,
		value: ResizeObserverStub,
	});
}

// Limpia el storage antes de cada test para aislarlos entre sí.
beforeEach(() => {
	window.localStorage?.clear();
	window.sessionStorage?.clear();
});

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
	cleanup();
});
