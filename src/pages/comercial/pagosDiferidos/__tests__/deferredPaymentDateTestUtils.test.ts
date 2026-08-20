import { describe, expect, it } from 'vitest';
import addDaysToDisplayDate from './deferredPaymentDateTestUtils';

describe('addDaysToDisplayDate', () => {
	it('suma días dentro del mismo mes', () => {
		expect(addDaysToDisplayDate('01-08-2026', 10)).toBe('11-08-2026');
	});

	it('no confunde el día 20 con un año ISO', () => {
		expect(addDaysToDisplayDate('20-08-2026', 45)).toBe('04-10-2026');
		expect(addDaysToDisplayDate('20-08-2026', 30)).toBe('19-09-2026');
		expect(addDaysToDisplayDate('20-08-2026', 21)).toBe('10-09-2026');
	});

	it('cruza el cambio de mes y de año', () => {
		expect(addDaysToDisplayDate('28-02-2028', 2)).toBe('01-03-2028');
		expect(addDaysToDisplayDate('25-12-2026', 10)).toBe('04-01-2027');
	});

	it('rechaza formatos distintos de DD-MM-YYYY', () => {
		expect(() => addDaysToDisplayDate('2026-08-20', 30)).toThrow(/DD-MM-YYYY/);
	});
});
