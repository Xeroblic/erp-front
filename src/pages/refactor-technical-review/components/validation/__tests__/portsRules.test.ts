import { describe, expect, it } from 'vitest';
import {
	filterPortOptions,
	MAX_PORT_TYPE_COUNT,
	normalizePortTypeCounts,
	setPortTypeCount,
	sumPortTypeCounts,
} from '../constants/ports.rules';

describe('normalizePortTypeCounts', () => {
	/**
	 * El desglose se guardaba como lista de tipos (`['hdmi','usb_c']`) y el backend ahora
	 * responde 422 ante esa forma. Una revisión abierta después del cambio traería la lista
	 * vieja desde la base: sin convertirla, el primer autosave la rechaza.
	 */
	it('migrates the stored list of types into a breakdown', () => {
		expect(normalizePortTypeCounts(['hdmi', 'usb_c'])).toEqual({ hdmi: 1, usb_c: 1 });
	});

	it('counts repeated types in the stored list', () => {
		expect(normalizePortTypeCounts(['hdmi', 'hdmi', 'usb_c'])).toEqual({ hdmi: 2, usb_c: 1 });
	});

	it('keeps a breakdown that already has the right shape', () => {
		expect(normalizePortTypeCounts({ hdmi: 2, charging: 1 })).toEqual({ hdmi: 2, charging: 1 });
	});

	it('drops types outside the catalog', () => {
		expect(normalizePortTypeCounts({ hdmi: 1, inventado: 3 })).toEqual({ hdmi: 1 });
	});

	it('drops a type the catalog stopped handling', () => {
		expect(normalizePortTypeCounts({ hdmi: 1, dvi: 2 })).toEqual({ hdmi: 1 });
	});

	/** El backend exige cantidades de 1 a 10: un tipo en cero se omite, no se envía en 0. */
	it('drops counts below the minimum instead of sending a zero', () => {
		expect(normalizePortTypeCounts({ hdmi: 0, usb_c: -2, rj45: 1 })).toEqual({ rj45: 1 });
	});

	it('caps counts at the maximum', () => {
		expect(normalizePortTypeCounts({ hdmi: 99 })).toEqual({ hdmi: MAX_PORT_TYPE_COUNT });
	});

	it('respects the bounds published by the schema', () => {
		expect(normalizePortTypeCounts({ hdmi: 7, vga: 1 }, ['hdmi'], 2, 4)).toEqual({ hdmi: 4 });
	});

	it('reads a missing breakdown as an empty one', () => {
		expect(normalizePortTypeCounts(undefined)).toEqual({});
		expect(normalizePortTypeCounts(null)).toEqual({});
	});
});

describe('filterPortOptions', () => {
	/**
	 * El backend sigue publicando DVI para otros clientes; esta operación dejó de
	 * manejarlo y no debe ofrecerlo aunque llegue en el schema.
	 */
	it('drops a type the catalog no longer handles', () => {
		expect(
			filterPortOptions([
				{ value: 'hdmi', label: 'HDMI' },
				{ value: 'dvi', label: 'DVI' },
				{ value: 'charging', label: 'Puerto de carga' },
			]),
		).toEqual([
			{ value: 'hdmi', label: 'HDMI' },
			{ value: 'charging', label: 'Puerto de carga' },
		]);
	});
});

describe('setPortTypeCount', () => {
	it('removes the type instead of leaving it at zero', () => {
		expect(setPortTypeCount({ hdmi: 1, usb_c: 2 }, 'hdmi', 0)).toEqual({ usb_c: 2 });
	});

	it('does not mutate the breakdown it receives', () => {
		const counts = { hdmi: 1 };

		setPortTypeCount(counts, 'usb_c', 2);

		expect(counts).toEqual({ hdmi: 1 });
	});
});

describe('sumPortTypeCounts', () => {
	/** El total que el servidor deriva del desglose; acá sólo se muestra. */
	it('adds up every type', () => {
		expect(sumPortTypeCounts({ hdmi: 2, usb_c: 1 })).toBe(3);
	});

	it('reads an empty or missing breakdown as zero', () => {
		expect(sumPortTypeCounts({})).toBe(0);
		expect(sumPortTypeCounts(undefined)).toBe(0);
	});
});
