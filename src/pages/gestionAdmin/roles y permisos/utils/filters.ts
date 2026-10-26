import type { FilterFn } from '@tanstack/react-table';
import type { UserRow } from '../types';
import { AppTableFeatures } from '@/components/ui/DataTable/tableFeatures';

export const globalFilterFn: FilterFn<AppTableFeatures, UserRow> = (
	row,
	_columnId,
	filterValue,
) => {
	if (!filterValue) return true;
	return row.original.searchText.includes(String(filterValue).toLowerCase());
};
