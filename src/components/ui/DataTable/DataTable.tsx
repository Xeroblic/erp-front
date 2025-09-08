import React from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	SortingState,
	VisibilityState,
	ColumnFiltersState,
	GlobalFilterTableState,
} from '@tanstack/react-table';
import Table, { THead, Tr, Th, TBody, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

interface DataTableProps<TData> {
	columns: ColumnDef<TData>[];
	data: TData[];
	searchPlaceholder?: string;
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	pageSize?: number;
	loading?: boolean;
	emptyMessage?: string;
}

export default function DataTable<TData>({
	columns,
	data,
	searchPlaceholder = 'Buscar...',
	searchValue = '',
	onSearchChange,
	pageSize = 10,
	loading = false,
	emptyMessage = 'No hay datos disponibles',
}: DataTableProps<TData>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [globalFilter, setGlobalFilter] = React.useState(searchValue);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: 'includesString',
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			globalFilter,
		},
		initialState: {
			pagination: {
				pageSize,
			},
		},
	});

	React.useEffect(() => {
		if (onSearchChange) {
			onSearchChange(globalFilter);
		}
	}, [globalFilter, onSearchChange]);

	React.useEffect(() => {
		setGlobalFilter(searchValue);
	}, [searchValue]);

	return (
		<div className='w-full space-y-4'>
			{/* Barra de búsqueda */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center space-x-2'>
					<Input
						placeholder={searchPlaceholder}
						value={globalFilter ?? ''}
						onChange={(e) => setGlobalFilter(String(e.target.value))}
						className='max-w-sm'
						prefix={<Icon icon='HeroMagnifyingGlass' className='h-4 w-4' />}
					/>
				</div>
				<div className='flex items-center space-x-2'>
					<Badge variant='outline'>
						{table.getFilteredRowModel().rows.length} resultados
					</Badge>
				</div>
			</div>

			{/* Tabla */}
			<div>
				<Table>
					<THead>
						{table.getHeaderGroups().map((headerGroup) => (
							<Tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<Th
										key={header.id}
										className={
											header.column.getCanSort()
												? 'cursor-pointer select-none'
												: ''
										}
										onClick={header.column.getToggleSortingHandler()}>
										<div className='flex items-center space-x-2'>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
											{header.column.getCanSort() && (
												<div className='flex flex-col'>
													<Icon
														icon='HeroChevronUp'
														className={`h-3 w-3 ${
															header.column.getIsSorted() === 'asc'
																? 'text-primary-600'
																: 'text-gray-400'
														}`}
													/>
													<Icon
														icon='HeroChevronDown'
														className={`-mt-1 h-3 w-3 ${
															header.column.getIsSorted() === 'desc'
																? 'text-primary-600'
																: 'text-gray-400'
														}`}
													/>
												</div>
											)}
										</div>
									</Th>
								))}
							</Tr>
						))}
					</THead>
					<TBody>
						{loading ? (
							<Tr>
								<Td colSpan={columns.length} className='py-8 text-center'>
									<div className='flex items-center justify-center space-x-2'>
										<Icon
											icon='HeroArrowPath'
											className='h-5 w-5 animate-spin'
										/>
										<span>Cargando...</span>
									</div>
								</Td>
							</Tr>
						) : table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<Tr
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									className='hover:bg-gray-50 dark:hover:bg-gray-800'>
									{row.getVisibleCells().map((cell) => (
										<Td key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Td>
									))}
								</Tr>
							))
						) : (
							<Tr>
								<Td colSpan={columns.length} className='py-8 text-center'>
									<div className='flex flex-col items-center space-y-2'>
										<Icon
											icon='HeroDocumentText'
											className='h-12 w-12 text-gray-400'
										/>
										<span className='text-gray-500'>{emptyMessage}</span>
									</div>
								</Td>
							</Tr>
						)}
					</TBody>
				</Table>
			</div>

			{/* Paginación */}
			<div className='flex items-center justify-between px-2'>
				<div className='flex items-center space-x-6 lg:space-x-8'>
					<div className='flex items-center space-x-2'>
						<p className='text-sm font-medium'>Filas por página</p>
						<select
							value={table.getState().pagination.pageSize}
							onChange={(e) => {
								table.setPageSize(Number(e.target.value));
							}}
							className='border-input bg-background h-8 w-16 rounded border px-3 py-1 text-sm'>
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<option key={pageSize} value={pageSize}>
									{pageSize}
								</option>
							))}
						</select>
					</div>
					<div className='flex w-24 items-center justify-center text-sm font-medium'>
						Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
					</div>
				</div>
				<div className='flex items-center space-x-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}>
						<Icon icon='HeroChevronDoubleLeft' className='h-4 w-4' />
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						<Icon icon='HeroChevronLeft' className='h-4 w-4' />
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						<Icon icon='HeroChevronRight' className='h-4 w-4' />
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}>
						<Icon icon='HeroChevronDoubleRight' className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Información de selección */}
			<div className='text-muted-foreground flex items-center justify-between text-sm'>
				<div>
					Mostrando {table.getRowModel().rows.length} de{' '}
					{table.getFilteredRowModel().rows.length} resultados
				</div>
			</div>
		</div>
	);
}
