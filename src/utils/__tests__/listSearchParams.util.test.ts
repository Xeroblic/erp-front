import { describe, expect, it } from 'vitest';
import {
	listReturnState,
	mergeListParams,
	parseBusinessDateParam,
	parseIdParam,
	parsePageParam,
	readListReturnSearch,
} from '@/utils/listSearchParams.util';

describe('lectura de filtros de listado en la URL', () => {
	it('acepta fechas reales y descarta las que no existen o tienen otro formato', () => {
		expect(parseBusinessDateParam('2026-09-30')).toBe('2026-09-30');
		expect(parseBusinessDateParam('2026-02-30')).toBe('');
		expect(parseBusinessDateParam('30-09-2026')).toBe('');
		expect(parseBusinessDateParam(null)).toBe('');
	});

	it('acepta sólo IDs enteros positivos', () => {
		expect(parseIdParam('12')).toBe(12);
		expect(parseIdParam('0')).toBeNull();
		expect(parseIdParam('012')).toBeNull();
		expect(parseIdParam('1.5')).toBeNull();
		expect(parseIdParam('abc')).toBeNull();
	});

	it('acota el tamaño de página al tope y cae al valor por defecto si no sirve', () => {
		expect(parsePageParam('50', 20, 100)).toBe(50);
		expect(parsePageParam('500', 20, 100)).toBe(20);
		expect(parsePageParam('-3', 20, 100)).toBe(20);
	});

	it('reemplaza sólo las claves del listado y deja intactas las demás', () => {
		const merged = mergeListParams(
			new URLSearchParams('status=draft&page=3&purchase_document_id=24'),
			['status', 'page'],
			new URLSearchParams('status=posted'),
		);
		expect(merged.toString()).toBe('purchase_document_id=24&status=posted');
	});
});

describe('vuelta de la ficha al listado', () => {
	it('recupera la query guardada al abrir la ficha', () => {
		expect(readListReturnSearch(listReturnState('?status=draft&page=2'))).toBe(
			'?status=draft&page=2',
		);
	});

	it('sin estado o con uno ajeno vuelve al listado sin filtros', () => {
		expect(readListReturnSearch(null)).toBe('');
		expect(readListReturnSearch({ listSearch: 42 })).toBe('');
		expect(readListReturnSearch({ listSearch: '//otro-sitio' })).toBe('');
		expect(readListReturnSearch({ from: '/inventario' })).toBe('');
	});
});
