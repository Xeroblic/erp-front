import { afterEach, describe, expect, it } from 'vitest';
import { readSessionItem, removeSessionItem, writeSessionItem } from '../sessionStorage.util';

const realSessionStorage = window.sessionStorage;

/** Simula un navegador que bloquea el almacenamiento: cualquier acceso lanza. */
const blockSessionStorage = () => {
	const blocked = () => {
		throw new DOMException('bloqueado', 'SecurityError');
	};
	Object.defineProperty(window, 'sessionStorage', {
		configurable: true,
		value: { getItem: blocked, setItem: blocked, removeItem: blocked },
	});
};

afterEach(() => {
	Object.defineProperty(window, 'sessionStorage', {
		configurable: true,
		value: realSessionStorage,
	});
});

describe('sessionStorage.util', () => {
	it('lee, escribe y borra cuando el almacenamiento está disponible', () => {
		writeSessionItem('clave', 'valor');
		expect(readSessionItem('clave')).toBe('valor');

		removeSessionItem('clave');
		expect(readSessionItem('clave')).toBeNull();
	});

	it('no lanza cuando el navegador bloquea el almacenamiento', () => {
		blockSessionStorage();

		expect(readSessionItem('clave')).toBeNull();
		expect(() => writeSessionItem('clave', 'valor')).not.toThrow();
		expect(() => removeSessionItem('clave')).not.toThrow();
	});
});
