import { useState } from 'react';
import type { PaginationState, Updater } from '@tanstack/react-table';
import type { TablePaginationController } from '@/templates/Table/TableFooterTemplateV2';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Pagina en el cliente una lista ya cargada y expone el controlador que espera
 * `TableCardFooterTemplateV2` (mismo criterio que `SupplierSuppliedProductsTable`).
 * La página se acota contra las filas actuales: si la lista se achica —por un
 * filtro o una recarga— no se queda en una página que ya no existe.
 */
const useClientPagination = <T>(rows: T[]) => {
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: DEFAULT_PAGE_SIZE,
	});

	const pageCount = Math.max(1, Math.ceil(rows.length / pagination.pageSize));
	const current: PaginationState = {
		pageIndex: Math.min(pagination.pageIndex, pageCount - 1),
		pageSize: pagination.pageSize,
	};
	const pageRows = rows.slice(
		current.pageIndex * current.pageSize,
		(current.pageIndex + 1) * current.pageSize,
	);

	const goToPage = (pageIndex: number) =>
		setPagination({ ...current, pageIndex: Math.min(Math.max(0, pageIndex), pageCount - 1) });

	const table: TablePaginationController = {
		getState: () => ({ pagination: current }),
		setPageSize: (updater: Updater<number>) => {
			const pageSize = typeof updater === 'function' ? updater(current.pageSize) : updater;
			setPagination({ pageIndex: 0, pageSize });
		},
		setPageIndex: (updater: Updater<number>) =>
			goToPage(typeof updater === 'function' ? updater(current.pageIndex) : updater),
		getCanPreviousPage: () => current.pageIndex > 0,
		previousPage: () => goToPage(current.pageIndex - 1),
		getPageCount: () => pageCount,
		getCanNextPage: () => current.pageIndex < pageCount - 1,
		nextPage: () => goToPage(current.pageIndex + 1),
	};

	const resetPage = () => setPagination((previous) => ({ ...previous, pageIndex: 0 }));

	return { pageRows, table, resetPage };
};

export default useClientPagination;
