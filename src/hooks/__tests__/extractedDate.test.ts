import { describe, it, expect } from 'vitest';
import extractDate from '../extractedDate';

describe('extractDate', () => {
	it('extrae los componentes de una fecha construyendo la referencia localmente', () => {
		const input = '2024-03-05T09:07:03';
		const ref = new Date(input);
		const out = extractDate(input);

		expect(out.year).toBe(ref.getFullYear());
		expect(out.month).toBe((ref.getMonth() + 1).toString().padStart(2, '0'));
		expect(out.day).toBe(ref.getDate().toString().padStart(2, '0'));
	});

	it('rellena con cero a la izquierda meses y días de un dígito', () => {
		const out = extractDate('2024-03-05T00:00:00');
		expect(out.month).toBe('03');
		expect(out.day).toBe('05');
	});

	it('rellena con cero horas, minutos y segundos de un dígito', () => {
		const ref = new Date('2024-11-20T04:08:09');
		const out = extractDate('2024-11-20T04:08:09');
		expect(out.hours).toBe(ref.getHours().toString().padStart(2, '0'));
		expect(out.minutes).toBe('08');
		expect(out.seconds).toBe('09');
	});

	it('devuelve un objeto con todas las claves esperadas', () => {
		const out = extractDate('2024-01-01T12:30:45');
		expect(Object.keys(out).sort()).toEqual(
			['day', 'hours', 'minutes', 'month', 'seconds', 'year'].sort(),
		);
	});

	it('el mes es 1-indexado (enero => 01, diciembre => 12)', () => {
		expect(extractDate('2024-01-15T10:00:00').month).toBe('01');
		expect(extractDate('2024-12-15T10:00:00').month).toBe('12');
	});
});
