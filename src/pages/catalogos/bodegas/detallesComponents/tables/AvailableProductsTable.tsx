import React, { useMemo } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	flexRender,
	createColumnHelper,
	type SortingState,
	type ColumnFiltersState,
} from '@tanstack/react-table';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import type { IProduct } from '@/interface/product.interface';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';

interface AvailableProductsTableProps {
	products: IProduct[];
	loading: boolean;
	onAttachProduct: (product: IProduct) => void;
}

const columnHelper = createColumnHelper<IProduct>();

const AvailableProductsTable: React.FC<AvailableProductsTableProps> = ({
	products,
	loading,
	onAttachProduct,
}) => {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = React.useState('');

	const columns = useMemo(
		() => [
			columnHelper.accessor('sku', {
				header: 'SKU',
				cell: (info) => <span className='font-mono text-sm'>{info.getValue()}</span>,
				enableSorting: true,
				enableColumnFilter: true,
			}),
			columnHelper.accessor('name', {
				header: 'Nombre',
				cell: (info) => <span className='text-sm'>{info.getValue()}</span>,
				enableSorting: true,
				enableColumnFilter: true,
			}),
			columnHelper.accessor((row) => row.brand?.name ?? 'N/A', {
				id: 'brand',
				header: 'Marca',
				cell: (info) => <span className='text-sm text-gray-600'>{info.getValue()}</span>,
				enableSorting: true,
				enableColumnFilter: true,
			}),
			columnHelper.accessor('stock', {
				header: 'Stock',
				cell: (info) => <span className='text-sm'>{info.getValue() ?? 0}</span>,
				enableSorting: true,
				meta: { align: 'right' },
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acción',
				cell: (info) => {
					const product = info.row.original;
					return (
						<div className='flex items-center justify-center gap-2'>
							<Button
								size='sm'
								variant='outline'
								color='blue'
								onClick={() => onAttachProduct(product)}>
								Asociar
							</Button>
						</div>
					);
				},
				meta: { align: 'center' },
			}),
		],
		[onAttachProduct],
	);

	const table = useReactTable({
		data: products,
		columns,
		state: {
			sorting,
			columnFilters,
			globalFilter,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

	if (loading) {
		return (
			<div className='py-8 text-center'>
				<Icon icon='HeroArrowPath' className='animate-spin text-2xl' />
				<p className='mt-2 text-sm text-gray-600'>Cargando productos...</p>
			</div>
		);
	}

	if (products.length === 0) {
		return (
			<div className='py-8 text-center text-sm text-gray-600'>
				No hay productos disponibles
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Barra de búsqueda global */}
			<div className='flex items-center gap-2'>
				<Input
					name='search'
					type='text'
					value={globalFilter ?? ''}
					onChange={(e) => setGlobalFilter(e.target.value)}
					placeholder='Buscar productos disponibles...'
				/>
				{globalFilter && (
					<Button size='sm' variant='outline' onClick={() => setGlobalFilter('')}>
						<Icon icon='HeroXMark' />
					</Button>
				)}
			</div>

			{/* Tabla */}
			<div className='0 overflow-x-auto rounded-lg'>
				<Table className='min-w-full divide-y'>
					<THead className=''>
						{table.getHeaderGroups().map((headerGroup) => (
							<Tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const meta = header.column.columnDef.meta as
										| { align?: string }
										| undefined;
									return (
										<Th
											key={header.id}
											className={`px-4 py-3 text-xs font-medium text-gray-500 ${
												meta?.align === 'right'
													? 'text-right'
													: meta?.align === 'center'
														? 'text-center'
														: 'text-left'
											}`}>
											{header.isPlaceholder ? null : (
												<div
													className={`flex items-center gap-2 ${
														header.column.getCanSort()
															? 'cursor-pointer select-none'
															: ''
													} ${
														meta?.align === 'right'
															? 'justify-end'
															: meta?.align === 'center'
																? 'justify-center'
																: ''
													}`}
													onClick={header.column.getToggleSortingHandler()}>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{header.column.getCanSort() && (
														<span className='text-gray-400'>
															{{
																asc: '↑',
																desc: '↓',
															}[
																header.column.getIsSorted() as string
															] ?? '⇅'}
														</span>
													)}
												</div>
											)}
										</Th>
									);
								})}
							</Tr>
						))}
					</THead>
					<TBody className='divide-y'>
						{table.getRowModel().rows.map((row) => (
							<Tr key={row.id} className=''>
								{row.getVisibleCells().map((cell) => {
									const meta = cell.column.columnDef.meta as
										| { align?: string }
										| undefined;
									return (
										<Td
											key={cell.id}
											className={`px-4 py-3 ${
												meta?.align === 'right'
													? 'text-right'
													: meta?.align === 'center'
														? 'text-center'
														: 'text-left'
											}`}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Td>
									);
								})}
							</Tr>
						))}
					</TBody>
				</Table>
			</div>

			{/* Paginación */}
			<div className='flex items-center justify-between'>
				<div className='text-sm text-gray-600'>
					Mostrando{' '}
					{table.getState().pagination.pageIndex * table.getState().pagination.pageSize +
						1}{' '}
					a{' '}
					{Math.min(
						(table.getState().pagination.pageIndex + 1) *
							table.getState().pagination.pageSize,
						table.getFilteredRowModel().rows.length,
					)}{' '}
					de {table.getFilteredRowModel().rows.length} resultados
				</div>
				<div className='flex items-center gap-2'>
					<Button
						size='sm'
						variant='outline'
						onClick={() => table.setPageIndex(0)}
						isDisable={!table.getCanPreviousPage()}>
						<Icon icon='HeroChevronDoubleLeft' />
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={() => table.previousPage()}
						isDisable={!table.getCanPreviousPage()}>
						<Icon icon='HeroChevronLeft' />
					</Button>
					<span className='text-sm text-gray-600'>
						Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
					</span>
					<Button
						size='sm'
						variant='outline'
						onClick={() => table.nextPage()}
						isDisable={!table.getCanNextPage()}>
						<Icon icon='HeroChevronRight' />
					</Button>
					<Button
						size='sm'
						variant='outline'
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						isDisable={!table.getCanNextPage()}>
						<Icon icon='HeroChevronDoubleRight' />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default AvailableProductsTable;
