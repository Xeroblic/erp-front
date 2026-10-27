import {
	columnFilteringFeature,
	columnVisibilityFeature,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	globalFilteringFeature,
	rowPaginationFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_datetime,
	sortFn_text,
	tableFeatures,
} from '@tanstack/react-table';

/**
 * Features de TanStack Table que usan las tablas de la app. Desde la 9 cada tabla
 * declara las suyas; los tipos (`ColumnDef`, `Table`, `Row`, `CellContext`) se
 * declaran con `AppTableFeatures`.
 *
 * Sin row models registrados la tabla muestra las filas tal como llegan: sirve para
 * las que ordenan, filtran o paginan en el servidor.
 */
export const appTableFeatures = tableFeatures({
	columnFilteringFeature,
	globalFilteringFeature,
	columnVisibilityFeature,
	rowSortingFeature,
	rowPaginationFeature,
});

export type AppTableFeatures = typeof appTableFeatures;

/**
 * Las mismas features, con filtrado, orden y paginación en el cliente. Con
 * `manualPagination` la tabla no corta las filas, igual que en la 8.
 *
 * Sólo se registran las funciones de orden que elige `'auto'` (`basic` viene
 * incluida). La búsqueda global usa `includesString`, que la tabla recibe directo.
 */
export const clientTableFeatures = tableFeatures({
	...appTableFeatures,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime },
});
