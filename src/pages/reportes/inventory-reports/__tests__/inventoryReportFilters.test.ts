import { describe, expect, it } from 'vitest';
import {
	DEFAULT_INVENTORY_REPORT_FILTERS,
	filtersLabelOf,
	nextInventoryReportSort,
	parseInventoryReportFilters,
	serializeInventoryReportFilters,
	type IInventoryReportFilters,
} from '@/pages/reportes/inventory-reports/types';

describe('Filtros de Reportes › Inventario en la URL', () => {
	it('sin parámetros abre Datos con los valores por defecto', () => {
		expect(parseInventoryReportFilters(new URLSearchParams())).toEqual(
			DEFAULT_INVENTORY_REPORT_FILTERS,
		);
	});

	it('un enlace copiado vuelve a abrir exactamente el mismo reporte', () => {
		const filters: IInventoryReportFilters = {
			vista: 'umbrales',
			busqueda: 'mouse',
			sucursal: 4,
			estado: 'critical',
			orden: { field: 'disponible', direction: 'desc' },
			page: 3,
			perPage: 50,
		};

		const params = serializeInventoryReportFilters(filters);

		expect(params.toString()).toBe(
			'vista=umbrales&q=mouse&sucursal=4&estado=critical&orden=-disponible&page=3&per_page=50',
		);
		expect(parseInventoryReportFilters(params)).toEqual(filters);
	});

	it('los valores por defecto no se escriben en la URL', () => {
		expect(serializeInventoryReportFilters(DEFAULT_INVENTORY_REPORT_FILTERS).toString()).toBe(
			'',
		);
	});

	it('un valor editado a mano cae al valor por defecto en vez de romper la vista', () => {
		const filters = parseInventoryReportFilters(
			new URLSearchParams(
				'vista=rotacion&sucursal=0&estado=roto&orden=-&page=-2&per_page=abc',
			),
		);

		expect(filters).toEqual(DEFAULT_INVENTORY_REPORT_FILTERS);
	});

	it('el primer clic ordena ascendente, el segundo descendente y otra columna vuelve a ascendente', () => {
		const first = nextInventoryReportSort(null, 'stock');
		const second = nextInventoryReportSort(first, 'stock');
		const other = nextInventoryReportSort(second, 'producto');

		expect(first).toEqual({ field: 'stock', direction: 'asc' });
		expect(second).toEqual({ field: 'stock', direction: 'desc' });
		expect(other).toEqual({ field: 'producto', direction: 'asc' });
	});

	it('describe en texto la búsqueda y el estado para el encabezado del archivo', () => {
		expect(filtersLabelOf(DEFAULT_INVENTORY_REPORT_FILTERS)).toBeNull();
		expect(
			filtersLabelOf({
				...DEFAULT_INVENTORY_REPORT_FILTERS,
				busqueda: '  mouse ',
				estado: 'out',
			}),
		).toBe('búsqueda «mouse» · estado Sin disponible');
	});
});
