import type { FilterFn } from '@tanstack/react-table';
import { AppTableFeatures } from '@/components/ui/DataTable/tableFeatures';
import type { UserRow } from '../types';

export const globalFilterFn: FilterFn<AppTableFeatures, UserRow> = (
	row,
	_columnId,
	filterValue,
) => {
	if (!filterValue) return true;
	return row.original.searchText.includes(String(filterValue).toLowerCase());
};
