import type { FilterFn } from '@tanstack/react-table';
import type { UserRow } from '../types';

export const globalFilterFn: FilterFn<UserRow> = (row, _columnId, filterValue) => {
	if (!filterValue) return true;
	return row.original.searchText.includes(String(filterValue).toLowerCase());
};
