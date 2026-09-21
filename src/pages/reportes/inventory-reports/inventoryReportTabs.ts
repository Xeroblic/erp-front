/**
 * Pestañas de Reportes › Inventario. `stock` existe hoy en el backend; el resto
 * son R1–R4 de `docs/inventario-unificado-contrato.md` y sólo se muestran si
 * `GET S/reports` las informa, así ninguna pestaña aparece sin su endpoint.
 */

export type TInventoryReportType =
	| 'stock'
	| 'stock_health'
	| 'replenishment'
	| 'dead_stock'
	| 'rotation';

/** Fila ya lista para la tabla: cada columna es texto o número. */
export type TInventoryReportRow = Record<string, string | number>;

export interface IInventoryReportColumn {
	/** Ruta con puntos dentro de la fila del backend (`product.name`). */
	field: string;
	header: string;
	numeric?: boolean;
	/** Campo alternativo cuando `field` viene vacío (Existencias: bodega → sucursal). */
	fallbackField?: string;
	/** Traduce códigos del backend a texto legible. */
	labels?: Record<string, string>;
}

export interface IInventoryReportTab {
	type: TInventoryReportType;
	label: string;
	description: string;
	columns: IInventoryReportColumn[];
}

const PRODUCT_COLUMNS: IInventoryReportColumn[] = [
	{ field: 'product.sku', header: 'SKU' },
	{ field: 'product.name', header: 'Producto' },
];

export const INVENTORY_REPORT_TABS: IInventoryReportTab[] = [
	{
		type: 'stock',
		label: 'Existencias',
		description: 'Unidades por producto y bodega',
		columns: [
			{ field: 'sku', header: 'SKU' },
			{ field: 'product_name', header: 'Producto' },
			{ field: 'warehouse_name', header: 'Bodega', fallbackField: 'branch_name' },
			{ field: 'quantity', header: 'Stock', numeric: true },
		],
	},
	{
		type: 'stock_health',
		label: 'Stock crítico',
		description: 'Productos bajo el umbral, sin umbral o sin disponible, por sucursal',
		columns: [
			...PRODUCT_COLUMNS,
			{ field: 'branch.name', header: 'Sucursal' },
			{ field: 'physical_quantity', header: 'En bodega', numeric: true },
			{ field: 'available_quantity', header: 'Disponible', numeric: true },
			{ field: 'threshold', header: 'Umbral', numeric: true },
			{
				field: 'status',
				header: 'Estado',
				labels: {
					critical: 'Bajo el umbral',
					healthy: 'Normal',
					unconfigured: 'Sin umbral',
				},
			},
		],
	},
	{
		type: 'replenishment',
		label: 'Reposición',
		description: 'Qué reponer y a qué proveedor, según las compras anteriores',
		columns: [
			...PRODUCT_COLUMNS,
			{ field: 'stock.available_quantity', header: 'Disponible', numeric: true },
			{ field: 'stock.threshold', header: 'Umbral', numeric: true },
			{ field: 'recommendation.supplier.display_name', header: 'Proveedor sugerido' },
			{
				field: 'recommendation.status',
				header: 'Sugerencia',
				labels: {
					suggested: 'Proveedor sugerido',
					without_supplier_history: 'Sin compras anteriores',
					no_active_suppliers: 'Sin proveedores activos',
					no_comparable_cost: 'Sin costo comparable',
				},
			},
		],
	},
	{
		type: 'dead_stock',
		label: 'Sin movimiento',
		description: 'Productos con stock que no se mueven hace tiempo',
		columns: [
			...PRODUCT_COLUMNS,
			{ field: 'branch.name', header: 'Sucursal' },
			{ field: 'physical_quantity', header: 'En bodega', numeric: true },
			{ field: 'last_operation_at', header: 'Último movimiento' },
			{ field: 'days_without_movement', header: 'Días sin movimiento', numeric: true },
		],
	},
	{
		type: 'rotation',
		label: 'Rotación',
		description: 'Cuánto sale de cada producto frente a lo que se mantiene en bodega',
		columns: [
			...PRODUCT_COLUMNS,
			{ field: 'units_out', header: 'Unidades vendidas', numeric: true },
			{ field: 'average_on_hand', header: 'Stock promedio', numeric: true },
			{ field: 'rotation', header: 'Rotación', numeric: true },
		],
	},
];

export const isInventoryReportType = (value: string | null): value is TInventoryReportType =>
	INVENTORY_REPORT_TABS.some((tab) => tab.type === value);

const readPath = (source: unknown, path: string): unknown =>
	path.split('.').reduce<unknown>((current, key) => {
		if (typeof current !== 'object' || current === null) return undefined;
		return (current as Record<string, unknown>)[key];
	}, source);

/**
 * Convierte una fila del backend (forma desconocida) en celdas de texto o
 * número según las columnas de la pestaña. Lo que falta se muestra como «—».
 */
export const toInventoryReportRow = (
	source: unknown,
	columns: IInventoryReportColumn[],
): TInventoryReportRow =>
	Object.fromEntries(
		columns.map((column) => {
			const primary = readPath(source, column.field);
			const value =
				(primary === null || primary === undefined || primary === '') &&
				column.fallbackField
					? readPath(source, column.fallbackField)
					: primary;
			if (column.numeric) {
				const parsed = typeof value === 'number' ? value : Number(value);
				return [
					column.field,
					value === null || value === undefined || Number.isNaN(parsed) ? '—' : parsed,
				];
			}
			if (typeof value === 'string' && value !== '')
				return [column.field, column.labels?.[value] ?? value];
			if (typeof value === 'number') return [column.field, value];
			return [column.field, '—'];
		}),
	);
