import React from 'react';
import { CategoryTableRow } from '@/components/helper/category.helper';
import { ICategory } from '../../types';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import Card, { CardBody } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import useDarkMode from '@/hooks/useDarkMode';

interface CategoriesTableProps {
	rows: CategoryTableRow[];
	onView: (category: ICategory) => void;
	onEdit: (category: ICategory) => void;
	onDelete: (category: ICategory) => void;
	onToggleStatus: (category: ICategory) => void;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({
	rows,
	onView,
	onEdit,
	onDelete,
	onToggleStatus,
}) => {
	const { isDarkTheme } = useDarkMode();
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
	const actionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

	React.useEffect(() => {
		const handleDocClick = (event: MouseEvent) => {
			if (!openDropdownId) return;
			const target = event.target as Node;
			const container = actionRefs.current[openDropdownId];
			if (container && !container.contains(target)) {
				setOpenDropdownId(null);
			}
		};

		document.addEventListener('click', handleDocClick);
		return () => document.removeEventListener('click', handleDocClick);
	}, [openDropdownId]);

	const columns = React.useMemo<ColumnDef<CategoryTableRow>[]>(
		() => [
			{
				id: 'image',
				header: 'Imagen',
				enableSorting: false,
				cell: ({ row }) => {
					const img = row.original.category.image;
					return (
						<div className='h-10 w-10 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700'>
							{img?.url ? (
								<img
									src={img.thumb || img.url}
									alt={img.alt || row.original.category.name}
									className='h-full w-full object-cover'
								/>
							) : (
								<div className='flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'>
									N/A
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: 'name',
				accessorFn: (row) => row.category.name,
				header: 'Categoria',
				enableSorting: false,
				cell: ({ row }) => {
					const { category, depth, parentNames } = row.original;
					const fullPath = parentNames.length
						? `${parentNames.join(' > ')} > ${category.name}`
						: category.name;
					const indent = depth ? depth * 16 : 0;
					return (
						<div
							className={`space-y-1 ${
								depth
									? 'border-l border-dashed border-indigo-200 pl-4 dark:border-indigo-600/60'
									: ''
							}`}
							style={{ marginLeft: indent }}>
							<div className='flex items-center gap-2'>
								{depth > 0 && (
									<span
										className='text-xs text-indigo-500 dark:text-indigo-300'
										aria-hidden>
										↳
									</span>
								)}
								<span
									className={`text-sm font-medium ${isDarkTheme ? 'text-indigo-300' : 'text-gray-900'}`}>
									{category.name}
								</span>
							</div>
							<div className='text-xs text-gray-500 dark:text-gray-400'>
								{row.original.parentNames.length === 0
									? 'Principal'
									: category.description || ''}
							</div>
							{parentNames.length > 0 && (
								<div className='text-xs text-gray-400 dark:text-gray-500'>
									Ruta: {fullPath}
								</div>
							)}
						</div>
					);
				},
			},
			{
				id: 'parent',
				header: 'Padre',
				enableSorting: false,
				cell: ({ row }) => {
					const parentNames = row.original.parentNames;
					const parentLabel =
						parentNames.length === 0
							? 'Principal'
							: parentNames[parentNames.length - 1] || 'Principal';
					return (
						<div className='text-sm'>
							{parentLabel === ' ' ? 'Principal' : parentLabel}
						</div>
					);
				},
			},
			{
				id: 'products',
				accessorFn: (row) => row.category.products_count ?? 0,
				header: 'Productos',
				enableSorting: false,
				cell: ({ row }) => (
					<div className='text-sm'>{row.original.category.products_count ?? 0}</div>
				),
			},
			// {
			// 	id: 'status',
			// 	accessorFn: (row) => row.category.is_active,
			// 	header: 'Estado',
			// 	enableSorting: false,
			// 	cell: ({ row }) => (
			// 		<Badge color={row.original.category.is_active ? 'emerald' : 'red'}>
			// 			{row.original.category.is_active ? 'Activa' : 'Inactiva'}
			// 		</Badge>
			// 	),
			// },
			{
				id: 'actions',
				header: 'Acciones',
				enableSorting: false,
				cell: ({ row }) => {
					const { category } = row.original;
					const idKey = String(category.id ?? row.id);
					const menuItemClass =
						'flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700';

					return (
						<div
							ref={(el) => (actionRefs.current[idKey] = el)}
							className='flex items-center justify-end space-x-2'
						>
							{/* <Button
									size='sm'
									variant='outline'
									onClick={() => onToggleStatus(category)}
									className='text-emerald-600 hover:text-emerald-900'>
									<Icon icon='HeroPower' className='h-4 w-4' />
								</Button> */}
							<div className='hidden space-x-2 sm:flex'>
								<Button
									size='sm'
									variant='outline'
									onClick={() => onView(category)}
									className='text-blue-600 hover:text-blue-900'>
									<Icon icon='HeroEye' className='h-4 w-4' />
								</Button>
								<Button
									size='sm'
									variant='outline'
									onClick={() => onEdit(category)}
									className='text-indigo-600 hover:text-indigo-900'>
									<Icon icon='HeroPencilSquare' className='h-4 w-4' />
								</Button>
								<Button
									size='sm'
									variant='outline'
									onClick={() => onDelete(category)}
									className='text-red-600 hover:text-red-900'>
									<Icon icon='HeroTrash' className='h-4 w-4' />
								</Button>
							</div>

							<div className='relative sm:hidden'>
								<Button
									size='sm'
									variant='outline'
									onClick={() =>
										setOpenDropdownId((prev) => (prev === idKey ? null : idKey))
									}
									aria-expanded={openDropdownId === idKey}
									aria-controls={`category-actions-${idKey}`}>
									<Icon icon='HeroDotsVertical' className='h-4 w-4' />
								</Button>

								{openDropdownId === idKey && (
									<div
										id={`category-actions-${idKey}`}
										className='absolute right-0 z-20 mt-2 w-44 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800'>
										<button
											onClick={() => {
												onView(category);
												setOpenDropdownId(null);
											}}
											className={menuItemClass}>
											<Icon icon='HeroEye' className='h-4 w-4' />
											Ver
										</button>
										<button
											onClick={() => {
												onEdit(category);
												setOpenDropdownId(null);
											}}
											className={menuItemClass}>
											<Icon icon='HeroPencilSquare' className='h-4 w-4' />
											Editar
										</button>
										<button
											onClick={() => {
												onDelete(category);
												setOpenDropdownId(null);
											}}
											className={`${menuItemClass} text-red-600`}>
											<Icon icon='HeroTrash' className='h-4 w-4' />
											Eliminar
										</button>
									</div>
								)}
							</div>
						</div>
					);
				},
			},
		],
		[isDarkTheme, onDelete, onEdit, onToggleStatus, onView, openDropdownId],
	);

	const table = useReactTable({
		data: rows,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<Container>
			<Card>
				<CardBody className='overflow-x-auto'>
					<Table className='w-full'>
						<THead>
							{table.getHeaderGroups().map((headerGroup) => (
								<Tr key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<Th key={header.id} className='text-left'>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</Th>
									))}
								</Tr>
							))}
						</THead>
						<TBody>
							{table.getRowModel().rows.map((row) => (
								<Tr key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<Td key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</Td>
									))}
								</Tr>
							))}
						</TBody>
					</Table>
					<div className='mt-4'>
						<TableCardFooterTemplateV2 table={table} />
					</div>
				</CardBody>
			</Card>
		</Container>
	);
};

export default CategoriesTable;
