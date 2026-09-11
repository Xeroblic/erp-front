import type { PaginationState, Updater } from '@tanstack/react-table';
import { ProductCard, WarehouseLabel } from '@/components/procurement';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import {
	TableCardFooterTemplateV2,
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type {
	IApiPaginationMeta,
	IInventoryLocationContext,
	IInventoryStockRow,
} from '@/interface/procurement.interface';

const COLUMN_COUNT = 6;

interface IStockPorUbicacionTableProps {
	rows: IInventoryStockRow[];
	context: IInventoryLocationContext | null;
	meta: IApiPaginationMeta | null;
	loading: boolean;
	hasError: boolean;
	hasFilters: boolean;
	onPaginationChange: (page: number, perPage: number) => void;
	onRowClick: (row: IInventoryStockRow) => void;
}

const StockPorUbicacionPagination = ({
	meta,
	loading,
	onChange,
}: {
	meta: IApiPaginationMeta;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
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

const StockPorUbicacionTable = ({
	rows,
	context,
	meta,
	loading,
	hasError,
	hasFilters,
	onPaginationChange,
	onRowClick,
}: IStockPorUbicacionTableProps) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Stock físico</CardTitle>
			<div className='flex flex-wrap items-center gap-3'>
				{context && !loading && (
					<span className='text-sm text-zinc-500'>
						Sucursal {context.branch_id} ·{' '}
						{context.scope === 'branch' ? (
							'Sucursal completa'
						) : (
							<WarehouseLabel warehouse={context.warehouse} withIcon={false} />
						)}
					</span>
				)}
				{!hasError && (
					<span className='text-sm text-zinc-500'>
						{meta?.total ?? rows.length} productos
					</span>
				)}
			</div>
		</CardHeader>
		<CardBody className='overflow-x-auto p-0'>
			<Table aria-label='Stock físico por ubicación' className='min-w-[900px]'>
				<THead>
					<Tr>
						<Th scope='col' rowSpan={2}>
							Producto
						</Th>
						<Th scope='col' rowSpan={2}>
							Físico
						</Th>
						<Th scope='colgroup' colSpan={2}>
							Condición
						</Th>
						<Th scope='colgroup' colSpan={2}>
							Documentación
						</Th>
					</Tr>
					<Tr>
						<Th scope='col'>Apto</Th>
						<Th scope='col'>No apto</Th>
						<Th scope='col'>Documentado</Th>
						<Th scope='col'>Sin documento</Th>
					</Tr>
				</THead>
				<TBody>
					{loading &&
						Array.from({ length: 5 }, (_, rowIndex) => (
							<Tr key={`stock-skeleton-${rowIndex}`}>
								{Array.from({ length: COLUMN_COUNT }, (_cell, cellIndex) => (
									<Td key={`stock-skeleton-${rowIndex}-${cellIndex}`}>
										<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
									</Td>
								))}
							</Tr>
						))}
					{!loading && hasError && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-red-700 dark:text-red-300'>
									No fue posible mostrar el stock
								</p>
							</Td>
						</Tr>
					)}
					{!loading && !hasError && rows.length === 0 && (
						<Tr>
							<Td colSpan={COLUMN_COUNT} className='py-12 text-center'>
								<p className='font-medium text-zinc-700 dark:text-zinc-200'>
									{hasFilters
										? 'Sin resultados para esta ubicación o búsqueda'
										: 'Aún no hay stock registrado en esta ubicación'}
								</p>
								<p className='mt-1 text-sm text-zinc-500'>
									{hasFilters
										? 'Prueba ajustando o limpiando los filtros.'
										: 'El stock aparecerá aquí cuando haya movimientos.'}
								</p>
							</Td>
						</Tr>
					)}
					{!loading &&
						!hasError &&
						rows.map((row) => (
							<Tr
								key={row.product.id}
								role='button'
								tabIndex={0}
								aria-label={`Ver detalle de ${row.product.name}`}
								onClick={() => onRowClick(row)}
								onKeyDown={(event) => {
									if (event.key === 'Enter' || event.key === ' ') {
										event.preventDefault();
										onRowClick(row);
									}
								}}
								className='cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'>
								<Td>
									<ProductCard
										product={row.product}
										density='compact'
										showCatalogPricing={false}
									/>
								</Td>
								<Td className='text-lg font-semibold tabular-nums'>
									{row.physical_quantity}
								</Td>
								<Td className='tabular-nums'>{row.fit_quantity}</Td>
								<Td
									className={
										row.unfit_quantity > 0
											? 'font-semibold text-amber-700 dark:text-amber-300'
											: ''
									}>
									{row.unfit_quantity}
								</Td>
								<Td className='border-l border-zinc-200 tabular-nums dark:border-zinc-700'>
									{row.documented_quantity}
								</Td>
								<Td className='tabular-nums'>{row.undocumented_quantity}</Td>
							</Tr>
						))}
				</TBody>
			</Table>
		</CardBody>
		{meta && !loading && !hasError && (
			<StockPorUbicacionPagination
				meta={meta}
				loading={loading}
				onChange={onPaginationChange}
			/>
		)}
	</Card>
);

export default StockPorUbicacionTable;
