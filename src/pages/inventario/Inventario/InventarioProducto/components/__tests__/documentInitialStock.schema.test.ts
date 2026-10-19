import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';
import { createDocumentInitialStockSchema } from '../documentInitialStock.schema';

const schema = createDocumentInitialStockSchema(10, (lineId) => (lineId === 7 ? 4 : undefined));
const valid = { documentId: '3', lineId: '7', quantity: '4', reason: 'Factura recuperada' };

const quantityError = (quantity: string): string | null => {
	try {
		schema.validateSyncAt('quantity', { ...valid, quantity });
		return null;
	} catch (error) {
		return error instanceof ValidationError ? error.message : String(error);
	}
};

describe('createDocumentInitialStockSchema', () => {
	it('acepta un respaldo dentro del saldo y de la capacidad de la línea', () => {
		expect(schema.isValidSync(valid)).toBe(true);
	});

	it('exige un entero positivo', () => {
		expect(quantityError('')).toBe('La cantidad debe ser un entero positivo.');
		expect(quantityError('2.5')).toBe('La cantidad debe ser un entero positivo.');
		expect(quantityError('0')).toBe('La cantidad debe ser un entero positivo.');
	});

	it('el saldo sin documentar se informa antes que la capacidad de la línea', () => {
		expect(quantityError('11')).toBe('No hay suficiente stock sin documentar (saldo: 10).');
		expect(quantityError('5')).toBe('La línea del documento sólo tiene 4 de capacidad.');
	});

	it('exige documento, línea y motivo', () => {
		expect(schema.isValidSync({ ...valid, documentId: '' })).toBe(false);
		expect(schema.isValidSync({ ...valid, lineId: '' })).toBe(false);
		expect(schema.isValidSync({ ...valid, reason: '   ' })).toBe(false);
	});
});
