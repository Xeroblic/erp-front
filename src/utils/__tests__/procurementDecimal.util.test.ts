import { describe, expect, it } from 'vitest';
import {
	divideRoundHalfUp,
	formatDecimalAmount,
	formatDecimalCents,
	formatPesoInput,
	parseDecimalString,
	parsePesoInput,
} from '@/utils/procurementDecimal.util';

describe('aritmética de importes', () => {
	it('parsea el string decimal del contrato sin pasar por float', () => {
		expect(parseDecimalString('5712.00')).toBe(571200n);
		expect(parseDecimalString('0.1')).toBe(10n);
		expect(parseDecimalString('-4800.55')).toBe(-480055n);
	});

	it('devuelve null ante un importe que no es decimal, en vez de asumir cero', () => {
		expect(parseDecimalString('')).toBeNull();
		expect(parseDecimalString('abc')).toBeNull();
		expect(parseDecimalString(null)).toBeNull();
		expect(parseDecimalString(undefined)).toBeNull();
	});

	it('conserva los centavos que un float perdería', () => {
		// 0.1 + 0.2 en float da 0.30000000000000004; sobre centésimas es exacto.
		const total = (parseDecimalString('0.1') ?? 0n) + (parseDecimalString('0.2') ?? 0n);

		expect(formatDecimalCents(total)).toBe('0.30');
	});

	it('redondea half-up, no half-even', () => {
		// 2,5 → 3 y 3,5 → 4: half-even daría 2 y 4.
		expect(divideRoundHalfUp(5n, 2n)).toBe(3n);
		expect(divideRoundHalfUp(7n, 2n)).toBe(4n);
	});

	it('formatea en es-CL y no convierte un importe desconocido en $0', () => {
		expect(formatDecimalAmount('5712.00', 'CLP')).toBe('$5.712,00');
		expect(formatDecimalAmount('1234567.89', 'CLP')).toBe('$1.234.567,89');
		expect(formatDecimalAmount(null, 'CLP')).toBeNull();
	});
});

describe('parsePesoInput', () => {
	it('quita símbolo y separadores de miles', () => {
		expect(parsePesoInput('$1.234.567')).toBe('1234567');
	});

	it('conserva la coma decimal con hasta dos decimales', () => {
		expect(parsePesoInput('$1.234,567')).toBe('1234,56');
		expect(parsePesoInput('12,')).toBe('12,');
	});

	it('ignora comas repetidas y texto no numérico', () => {
		expect(parsePesoInput('1,2,3')).toBe('1,23');
		expect(parsePesoInput('abc')).toBe('');
	});
});

describe('formatPesoInput', () => {
	it('deja vacío un campo vacío', () => {
		expect(formatPesoInput('')).toBe('');
	});

	it('agrupa miles con punto y usa coma decimal', () => {
		expect(formatPesoInput('1234567')).toBe('$1.234.567');
		expect(formatPesoInput('1234,5')).toBe('$1.234,5');
		expect(formatPesoInput('12,')).toBe('$12,');
	});

	it('acepta el decimal del contrato al editar', () => {
		expect(formatPesoInput('5712.00')).toBe('$5.712,00');
	});

	it('es inverso de parsePesoInput', () => {
		expect(parsePesoInput(formatPesoInput('98765,43'))).toBe('98765,43');
	});
});
