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
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

interface DataTableProps<TData> {
	columns: ColumnDef<TData, any>[];
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
	const initialSorting = React.useMemo<SortingState>(() => {
		const columnIds = columns
			.map((col) => {
				if ('id' in col && col.id) return col.id;
				// @ts-ignore tanstack ColumnDef uses accessorKey for keys
				return col.accessorKey as string | undefined;
			})
			.filter(Boolean);
		return columnIds.includes('id') ? [{ id: 'id', desc: false }] : [];
	}, [columns]);

	const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
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
					<div className='relative max-w-sm'>
						<Icon
							icon='HeroMagnifyingGlass'
							className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400'
						/>
						<Input
							name='filtro'
							placeholder={searchPlaceholder}
							value={globalFilter ?? ''}
							onChange={(e) => setGlobalFilter(String(e.target.value))}
							className='w-full pl-9'
						/>
					</div>
				</div>
				<div className='flex items-center space-x-2'>
					<Badge variant='outline' className='px-2'>
						{table.getFilteredRowModel().rows.length} resultados
					</Badge>
				</div>
			</div>

			{/* Tabla */}
			<div className='overflow-x-auto'>
				<Table className='w-full'>
					<THead>
						{table.getHeaderGroups().map((headerGroup) => (
							<Tr className='overflow-x-auto' key={headerGroup.id}>
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
			<TableCardFooterTemplateV2 table={table} />

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
