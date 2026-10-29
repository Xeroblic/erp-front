import React from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import {
	TableCardFooterTemplateV2,
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type { IApiPaginationMeta } from '@/interface/procurement.interface';

interface IInventarioPaginationProps {
	meta: IApiPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}

/**
 * Adapta el `meta` de Laravel al paginador estándar de las tablas
 * (`TableCardFooterTemplateV2`), que espera la interfaz de TanStack Table.
 */
const InventarioPagination: React.FC<IInventarioPaginationProps> = ({
	meta,
	loading,
	onChange,
}) => {
	const pagination: PaginationState = {
		pageIndex: Math.max(0, meta.current_page - 1),
		pageSize: meta.per_page,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: (updater: Updater<number>) => {
			const perPage = typeof updater === 'function' ? updater(pagination.pageSize) : updater;
			onChange(1, perPage);
		},
		setPageIndex: (updater: Updater<number>) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onChange(Math.min(Math.max(1, pageIndex + 1), meta.last_page), pagination.pageSize);
		},
		getCanPreviousPage: () => meta.current_page > 1,
		previousPage: () => onChange(Math.max(1, meta.current_page - 1), pagination.pageSize),
		getPageCount: () => meta.last_page,
		getCanNextPage: () => meta.current_page < meta.last_page,
		nextPage: () => onChange(meta.current_page + 1, pagination.pageSize),
	};

	return <TableCardFooterTemplateV2 table={table} isDisabled={loading} />;
};

export default InventarioPagination;
