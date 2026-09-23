import { describe, expect, it } from 'vitest';
import {
	DEFAULT_INVENTARIO_FILTROS,
	filtraItems,
	inventoryLocationParams,
	operacionTipoInfo,
	parseInventarioFiltros,
	serializeInventarioFiltros,
	trazabilidadParams,
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
			tipo: null,
			desde: '',
			hasta: '',
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

describe('Filtros de Trazabilidad en la URL', () => {
	it('ida y vuelta conserva el tipo de operación y el rango de fechas', () => {
		const filtros: IInventarioFiltros = {
			...DEFAULT_INVENTARIO_FILTROS,
			vista: 'trazabilidad',
			ubicacion: 'unlocated',
			busqueda: 'PCExpress',
			tipo: 'stock_receipt',
			desde: '2026-09-01',
			hasta: '2026-09-30',
		};
		const params = serializeInventarioFiltros(filtros);

		expect(params.get('vista')).toBe('trazabilidad');
		expect(params.get('tipo')).toBe('stock_receipt');
		expect(params.get('desde')).toBe('2026-09-01');
		expect(params.get('hasta')).toBe('2026-09-30');
		expect(parseInventarioFiltros(params)).toEqual(filtros);
	});

	it('descarta un tipo desconocido y fechas que no existen en el calendario', () => {
		const filtros = parseInventarioFiltros(
			new URLSearchParams('vista=trazabilidad&tipo=robo&desde=2026-02-30&hasta=30-09-2026'),
		);

		expect(filtros).toMatchObject({ vista: 'trazabilidad', tipo: null, desde: '', hasta: '' });
	});

	it('acepta el saldo inicial como tipo y rotula un tipo legado con su propio nombre', () => {
		expect(parseInventarioFiltros(new URLSearchParams('tipo=initial_balance')).tipo).toBe(
			'initial_balance',
		);
		expect(operacionTipoInfo('stock_receipt').label).toBe('Recepción');
		expect(operacionTipoInfo('equipment_move')).toMatchObject({
			label: 'equipment_move',
			icon: 'HeroQuestionMarkCircle',
		});
	});

	it('traduce los filtros al §14 acotados a la sucursal activa', () => {
		const params = trazabilidadParams(
			{
				ubicacion: 'warehouse:8',
				tipo: 'inventory_adjustment',
				busqueda: '  conteo ',
				desde: '2026-09-01',
				hasta: '',
				page: 2,
				perPage: 20,
			},
			4,
		);

		expect(params).toEqual({
			branch_id: 4,
			warehouse_id: 8,
			operation_type: 'inventory_adjustment',
			search: 'conteo',
			occurred_from: '2026-09-01',
			occurred_to: undefined,
			page: 2,
			per_page: 20,
		});
	});

	it('sólo marca ítems cuando un filtro elige productos, no operaciones', () => {
		expect(filtraItems({ branch_id: 4, operation_type: 'stock_receipt' })).toBe(false);
		expect(filtraItems({ branch_id: 4, occurred_from: '2026-09-01' })).toBe(false);
		expect(filtraItems({ branch_id: 4, search: 'mouse' })).toBe(true);
		expect(filtraItems({ branch_id: 4, unlocated: 1 })).toBe(true);
		expect(filtraItems({ branch_id: 4, product_id: 31 })).toBe(true);
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
