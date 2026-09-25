import { describe, expect, it } from 'vitest';
import { pastePhone, proveedorFormSchema } from '../types';

/**
 * El teléfono sigue el formato del backend (`+56` y 9 dígitos). Se valida el
 * campo aislado para que el resto del formulario no enmascare el resultado.
 */
const phoneError = (phone: string): string | null => {
	try {
		proveedorFormSchema.validateSyncAt('phone', { phone });
		return null;
	} catch (error) {
		return error instanceof Error ? error.message : String(error);
	}
};

describe('proveedorFormSchema · teléfono', () => {
	it.each(['+56912345678', '+56221234567', '+56322123456', '+56412123456'])(
		'acepta %s',
		(phone) => {
			expect(phoneError(phone)).toBeNull();
		},
	);

	it('acepta el teléfono vacío (es opcional)', () => {
		expect(phoneError('')).toBeNull();
	});

	it('acepta el número con espacios: se normalizan antes de validar', () => {
		expect(phoneError('+56 9 1234 5678')).toBeNull();
	});

	it.each([
		'912345678',
		'+5691234567',
		'+569123456789',
		'+569999999999999999999999999',
		'+54912345678',
	])('rechaza %s', (phone) => {
		expect(phoneError(phone)).toMatch(/\+56 y 9 dígitos/);
	});
});

describe('pastePhone', () => {
	it('normaliza antes de recortar, para no perder los últimos dígitos', () => {
		expect(pastePhone('', '+56 9 1234 5678', 0, 0)).toBe('+56912345678');
	});

	it('inserta en la posición del cursor y reemplaza la selección', () => {
		expect(pastePhone('+569', '1234 5678', 4, 4)).toBe('+56912345678');
		expect(pastePhone('+56900000000', '12345678', 4, 12)).toBe('+56912345678');
	});

	it('recorta al largo máximo lo que sobre', () => {
		expect(pastePhone('', '+56 9 1234 5678 99', 0, 0)).toBe('+56912345678');
	});
});
