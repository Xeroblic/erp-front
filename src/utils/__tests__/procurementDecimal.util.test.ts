import { describe, expect, it } from 'vitest';
import { formatPesoInput, parsePesoInput } from '@/utils/procurementDecimal.util';

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
