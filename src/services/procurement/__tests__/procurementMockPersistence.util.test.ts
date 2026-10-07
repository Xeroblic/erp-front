import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	loadAllPersistedMockStates,
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';

const PREFIX = 'zentria-erp:procurement-mock';
const key = (namespace: string, suffix: string): string => `${PREFIX}:${namespace}:${suffix}`;
const storedKeys = (): string[] =>
	Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
		.filter((storedKey): storedKey is string => storedKey !== null)
		.sort();

afterEach(() => {
	vi.restoreAllMocks();
});

describe('procurementMockPersistence.util', () => {
	it('persiste y recupera el estado de una partición', () => {
		savePersistedMockState('docs', 3, 7, { items: [1, 2] });

		expect(loadPersistedMockState('docs', 3, 7)).toEqual({ items: [1, 2] });
		expect(loadPersistedMockState('docs', 3, 8)).toBeNull();
	});

	it('al hidratar borra las versiones viejas del namespace y conserva la vigente y los ajenos', () => {
		window.localStorage.setItem(key('stock', 'v1:4'), '{"old":true}');
		window.localStorage.setItem(key('stock', 'v6:4'), '{"old":true}');
		window.localStorage.setItem(key('stock', 'v6:9'), '{"old":true}');
		window.localStorage.setItem(key('stock', 'v7:9'), '{"current":true}');
		window.localStorage.setItem(key('stock-history', 'v1:4'), '{"other":true}');
		window.localStorage.setItem('otra-app', 'x');

		expect(loadPersistedMockState('stock', 7, 4)).toBeNull();

		expect(storedKeys()).toEqual(
			[key('stock', 'v7:9'), key('stock-history', 'v1:4'), 'otra-app'].sort(),
		);
	});

	it('la carga de todas las particiones también purga las versiones viejas', () => {
		window.localStorage.setItem(key('products', 'v1:2'), '{"old":true}');
		window.localStorage.setItem(key('products', 'v2:2'), '{"current":true}');

		expect(loadAllPersistedMockStates('products', 2)).toEqual([[2, { current: true }]]);
		expect(storedKeys()).toEqual([key('products', 'v2:2')]);
	});

	it('una pestaña con código anterior no borra lo que guardó una versión más nueva', () => {
		savePersistedMockState('stock', 8, 4, { fromNewerTab: true });

		expect(loadPersistedMockState('stock', 7, 4)).toBeNull();

		expect(loadPersistedMockState('stock', 8, 4)).toEqual({ fromNewerTab: true });
	});

	it('la carga de todas las particiones tampoco borra versiones más nuevas', () => {
		savePersistedMockState('products', 3, 2, { fromNewerTab: true });
		savePersistedMockState('products', 1, 2, { stale: true });

		expect(loadAllPersistedMockStates('products', 2)).toEqual([]);

		expect(loadAllPersistedMockStates('products', 3)).toEqual([[2, { fromNewerTab: true }]]);
		expect(storedKeys()).toEqual([key('products', 'v3:2')]);
	});

	it('no toca claves del namespace cuya versión no es un entero canónico', () => {
		window.localStorage.setItem(key('stock', 'vX:4'), '{"unknown":true}');
		window.localStorage.setItem(key('stock', 'v07:4'), '{"padded":true}');

		loadPersistedMockState('stock', 7, 4);

		expect(storedKeys()).toEqual([key('stock', 'v07:4'), key('stock', 'vX:4')].sort());
	});

	it('sólo lee como partición un sufijo entero canónico', () => {
		window.localStorage.setItem(key('products', 'v1:'), '{"bare":true}');
		window.localStorage.setItem(key('products', 'v1:1e3'), '{"exp":true}');
		window.localStorage.setItem(key('products', 'v1:007'), '{"padded":true}');
		window.localStorage.setItem(key('products', 'v1:abc'), '{"text":true}');
		window.localStorage.setItem(key('products', 'v1:0'), '{"zero":true}');
		window.localStorage.setItem(key('products', 'v1:12'), '{"twelve":true}');

		const entries = loadAllPersistedMockStates('products', 1).sort(([a], [b]) => a - b);

		expect(entries).toEqual([
			[0, { zero: true }],
			[12, { twelve: true }],
		]);
	});

	it.each([
		['JSON corrupto', '{no es json'],
		['un número', '42'],
		['un texto', '"hola"'],
		['null', 'null'],
	])('descarta y borra una entrada que es %s', (_label, raw) => {
		window.localStorage.setItem(key('docs', 'v1:5'), raw);

		expect(loadPersistedMockState('docs', 1, 5)).toBeNull();
		expect(window.localStorage.getItem(key('docs', 'v1:5'))).toBeNull();
	});

	it('omite y borra las entradas corruptas al cargar todas las particiones', () => {
		window.localStorage.setItem(key('docs', 'v1:5'), '{no es json');
		window.localStorage.setItem(key('docs', 'v1:6'), '{"ok":true}');

		expect(loadAllPersistedMockStates('docs', 1)).toEqual([[6, { ok: true }]]);
		expect(storedKeys()).toEqual([key('docs', 'v1:6')]);
	});

	it('avisa una sola vez por namespace cuando se agota la cuota', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('lleno', 'QuotaExceededError');
		});

		expect(() => savePersistedMockState('quota-a', 1, 1, { a: 1 })).not.toThrow();
		savePersistedMockState('quota-a', 1, 2, { a: 2 });
		savePersistedMockState('quota-b', 1, 1, { b: 1 });

		expect(warn).toHaveBeenCalledTimes(2);
		expect(String(warn.mock.calls[0][0])).toContain('quota-a');
		expect(String(warn.mock.calls[1][0])).toContain('quota-b');
	});

	it('no avisa por un fallo de almacenamiento que no es de cuota', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('denegado', 'SecurityError');
		});

		expect(() => savePersistedMockState('denied', 1, 1, { a: 1 })).not.toThrow();
		expect(warn).not.toHaveBeenCalled();
	});
});
