import { describe, expect, it } from 'vitest';
import {
	DEFAULT_INVENTARIO_FILTROS,
	inventoryLocationParams,
	parseInventarioFiltros,
	serializeInventarioFiltros,
	UmbralSchema,
	type IInventarioFiltros,
} from '@/pages/inventario/Inventario/types';

describe('Filtros de Inventario en la URL', () => {
	it('sin parámetros son los valores por defecto y no escriben nada', () => {
		const filtros = parseInventarioFiltros(new URLSearchParams());
		expect(filtros).toEqual(DEFAULT_INVENTARIO_FILTROS);
		expect(serializeInventarioFiltros(filtros).toString()).toBe('');
	});

	it('ida y vuelta conserva todos los filtros', () => {
		const filtros: IInventarioFiltros = {
			vista: 'general',
			ubicacion: 'warehouse:12',
			estado: 'critical',
			busqueda: 'mouse',
			orden: '-available_quantity',
			page: 2,
			perPage: 50,
		};
		const params = serializeInventarioFiltros(filtros);
		expect(params.toString()).toBe(
			'bodega=12&estado=critical&q=mouse&orden=-available_quantity&page=2&per_page=50',
		);
		expect(parseInventarioFiltros(params)).toEqual(filtros);
	});

	it('valores desconocidos o mal formados caen al valor por defecto', () => {
		const filtros = parseInventarioFiltros(
			new URLSearchParams('vista=otra&bodega=abc&estado=x&orden=precio&page=-3&per_page=0'),
		);
		expect(filtros).toEqual(DEFAULT_INVENTARIO_FILTROS);
	});

	it('Sin ubicación gana a una bodega y se traduce al filtro del contrato', () => {
		const filtros = parseInventarioFiltros(new URLSearchParams('sin_ubicacion=1&bodega=8'));
		expect(filtros.ubicacion).toBe('unlocated');
		expect(inventoryLocationParams(filtros.ubicacion)).toEqual({ unlocated: 1 });
		expect(inventoryLocationParams('warehouse:8')).toEqual({ warehouse_id: 8 });
		expect(inventoryLocationParams('branch')).toEqual({});
	});
});

describe('UmbralSchema', () => {
	it('acepta vacío o enteros y rechaza decimales, signos y excesos', () => {
		expect(UmbralSchema.isValidSync({ threshold: '' })).toBe(true);
		expect(UmbralSchema.isValidSync({ threshold: '0' })).toBe(true);
		expect(UmbralSchema.isValidSync({ threshold: '15' })).toBe(true);
		expect(UmbralSchema.isValidSync({ threshold: '1.5' })).toBe(false);
		expect(UmbralSchema.isValidSync({ threshold: '-2' })).toBe(false);
		expect(UmbralSchema.isValidSync({ threshold: '2000000' })).toBe(false);
	});
});
