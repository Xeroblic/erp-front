import { describe, expect, it } from 'vitest';
import type { IProcurementSupplierCommune } from '@/interface/procurement.interface';
import { formatCommuneWithRegion, normalizePhone, pastePhone, proveedorFormSchema } from '../types';

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

	it.each(['912345678', '56912345678', '9-1234-5678', '(2) 2123 4567'])(
		'acepta %s: el prefijo que falta se completa antes de validar',
		(phone) => {
			expect(phoneError(phone)).toBeNull();
		},
	);

	it.each([
		'91234567',
		'+5691234567',
		'+569123456789',
		'+569999999999999999999999999',
		'+54912345678',
		'569123456',
	])('rechaza %s', (phone) => {
		expect(phoneError(phone)).toMatch(/Ingresa 9 dígitos/);
	});
});

describe('normalizePhone', () => {
	it.each([
		['+56 9 1234 5678', '+56912345678'],
		['56 9 1234 5678', '+56912345678'],
		['9 1234 5678', '+56912345678'],
		['9-1234-5678', '+56912345678'],
		['(2) 2123 4567', '+56221234567'],
		['32 212 3456', '+56322123456'],
	])('completa %s como %s', (input, expected) => {
		expect(normalizePhone(input)).toBe(expected);
	});

	it('deja a medias lo que aún no tiene 9 dígitos', () => {
		expect(normalizePhone('9 1234')).toBe('91234');
	});

	it('no antepone +56 a quien teclea 56… sin el +', () => {
		expect(normalizePhone('569123456')).toBe('569123456');
	});
});

describe('formatCommuneWithRegion', () => {
	const commune = (region: string | null): IProcurementSupplierCommune => ({
		id: 2102,
		name: 'Mejillones',
		province: {
			id: 21,
			name: 'Antofagasta',
			region: region === null ? null : { id: 2, name: region },
		},
	});

	it('agrega la región a la comuna', () => {
		expect(formatCommuneWithRegion(commune('Antofagasta'))).toBe('Mejillones, Antofagasta');
	});

	it('deja la comuna sola si no viene la región', () => {
		expect(formatCommuneWithRegion(commune(null))).toBe('Mejillones');
		expect(formatCommuneWithRegion({ id: 2102, name: 'Mejillones', province: null })).toBe(
			'Mejillones',
		);
	});

	it('devuelve null sin comuna', () => {
		expect(formatCommuneWithRegion(null)).toBeNull();
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

	it('completa el prefijo de lo pegado', () => {
		expect(pastePhone('', '9 1234 5678', 0, 0)).toBe('+56912345678');
		expect(pastePhone('', '56912345678', 0, 0)).toBe('+56912345678');
	});
});
