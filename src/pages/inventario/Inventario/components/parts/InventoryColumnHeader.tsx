import React from 'react';
import { Th } from '@/components/ui/Table';
import SortableTableHeader, { type TableSortState } from '@/components/ui/SortableTableHeader';
import { INVENTORY_OVERVIEW_FEATURES } from '@/services/procurement/inventoryOverview.service';
import type { TInventoryStockSortField } from '@/interface/inventoryOverview.interface';

const ALIGN_CLASS = { right: 'text-right', center: 'text-center' } as const;

interface IInventoryColumnHeaderProps {
	label: string;
	sortKey: TInventoryStockSortField;
	sort: TableSortState<TInventoryStockSortField>;
	onSort: (key: TInventoryStockSortField) => void;
	align?: keyof typeof ALIGN_CLASS;
}

/**
 * Encabezado de las tablas de Inventario. Es ordenable sólo si la fuente
 * ordena por esa columna: la ruta real ordena siempre por nombre, y un
 * encabezado clicable que no cambia nada prometería un orden que no existe.
 */
const InventoryColumnHeader: React.FC<IInventoryColumnHeaderProps> = ({
	label,
	sortKey,
	sort,
	onSort,
	align,
}) =>
	INVENTORY_OVERVIEW_FEATURES.sort ? (
		<SortableTableHeader
			label={label}
			sortKey={sortKey}
			sort={sort}
			onSort={onSort}
			align={align}
		/>
	) : (
		<Th scope='col' className={align ? ALIGN_CLASS[align] : undefined}>
			{label}
		</Th>
	);

export default InventoryColumnHeader;
