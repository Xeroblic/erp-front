import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CategoryTableRow } from '@/components/helper/category.helper';
import { ICategory } from '../../types';
import Card, { CardBody } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Select from '@/components/form/Select';
import Tooltip from '@/components/ui/Tooltip';
import DataTable from '@/components/ui/DataTable';
import useDarkMode from '@/hooks/useDarkMode';

type LevelFilter = 'all' | 'root' | 'child';
type ProductFilter = 'all' | 'with' | 'without';
type StatusFilter = 'all' | 'active' | 'inactive';

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
	const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
	const actionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

	const [levelFilter, setLevelFilter] = React.useState<LevelFilter>('all');
	const [productFilter, setProductFilter] = React.useState<ProductFilter>('all');
	const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

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

	const activeFilterCount = React.useMemo(() => {
		let count = 0;
		if (levelFilter !== 'all') count++;
		if (productFilter !== 'all') count++;
		if (statusFilter !== 'all') count++;
		return count;
	}, [levelFilter, productFilter, statusFilter]);

	const filteredRows = React.useMemo(() => {
		let result = rows;

		if (levelFilter === 'root') {
			result = result.filter((r) => r.depth === 0);
		} else if (levelFilter === 'child') {
			result = result.filter((r) => r.depth > 0);
		}

		if (productFilter === 'with') {
			result = result.filter((r) => (r.category.products_count ?? 0) > 0);
		} else if (productFilter === 'without') {
			result = result.filter((r) => (r.category.products_count ?? 0) === 0);
		}

		if (statusFilter === 'active') {
			result = result.filter((r) => r.category.is_active);
		} else if (statusFilter === 'inactive') {
			result = result.filter((r) => !r.category.is_active);
		}

		return result;
	}, [rows, levelFilter, productFilter, statusFilter]);

	const handleClearFilters = React.useCallback(() => {
		setLevelFilter('all');
		setProductFilter('all');
		setStatusFilter('all');
	}, []);

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
					const { parentNames } = row.original;
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
			{
				id: 'status',
				accessorFn: (row) => row.category.is_active,
				header: 'Estado',
				enableSorting: false,
				cell: ({ row }) => (
					<Badge
						color={row.original.category.is_active ? 'emerald' : 'red'}
						variant='outline'
						className='text-xs'>
						{row.original.category.is_active ? 'Activa' : 'Inactiva'}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: 'Acciones',
				enableSorting: false,
				cell: ({ row }) => {
					const { category } = row.original;
					const idKey = String(category.id ?? row.id);
					const menuItemClass =
						'flex w-full items-center gap-2 px-4 py-2 text-left';

					return (
						<div
							ref={(el) => {
								actionRefs.current[idKey] = el;
							}}
							className='flex items-center justify-end space-x-2'>
							<div className='hidden space-x-2 sm:flex'>
								<Tooltip text='Ir a detalles'>
									<Button
										aria-label='Ver detalles'
										size='sm'
										variant='outline'
										color='violet'
										className='group'
										onClick={() => onView(category)}>
										<Icon icon='HeroEye' className='h-4 w-4 text-violet-600 group-hover:text-violet-400' />
									</Button>
								</Tooltip>
								<Tooltip text='Editar categoria'>
									<Button
										aria-label='Editar categoria'
										size='sm'
										variant='outline'
										color='lime'
										onClick={() => onEdit(category)}
										className='group'>
										<Icon icon='HeroPencilSquare' className='h-4 w-4 text-lime-600 group-hover:text-lime-400' />
									</Button>
								</Tooltip>
								<Tooltip text='Eliminar categoria'>
									<Button
										aria-label='Eliminar categoria'
										size='sm'
										variant='outline'
										color='red'
										onClick={() => onDelete(category)}
										className='group'>
										<Icon icon='HeroTrash' className='h-4 w-4 text-red-600 group-hover:text-red-400' />
									</Button>
								</Tooltip>
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
										<Tooltip text='Ir a detalle'>
											<Button
												onClick={() => {
													onView(category);
													setOpenDropdownId(null);
												}}
												className={menuItemClass}>
												<Icon icon='HeroEye' className='h-4 w-4' />
												Ver
											</Button>
										</Tooltip>
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

	return (
		<Container>
			<Card>
				<CardBody className='space-y-4 overflow-x-auto'>
					{/* Barra de filtros */}
					<div className='flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50 sm:flex-row sm:items-center'>
						<div className='flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400'>
							<Icon icon='HeroFunnel' className='h-4 w-4' />
							<span className='hidden sm:inline'>Filtros</span>
						</div>

						<div className='flex flex-1 flex-wrap items-center gap-2'>
							<Select
								name='levelFilter'
								dimension='sm'
								color='zinc'
								colorIntensity='400'
								value={levelFilter}
								onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
								className='w-full sm:w-auto sm:min-w-[150px]'>
								<option value='all'>Todos los niveles</option>
								<option value='root'>Principales</option>
								<option value='child'>Subcategorías</option>
							</Select>
							<Select
								name='productFilter'
								dimension='sm'
								color='zinc'
								colorIntensity='400'
								value={productFilter}
								onChange={(e) => setProductFilter(e.target.value as ProductFilter)}
								className='w-full sm:w-auto sm:min-w-[160px]'>
								<option value='all'>Todos los productos</option>
								<option value='with'>Con productos</option>
								<option value='without'>Sin productos</option>
							</Select>
							<Select
								name='statusFilter'
								dimension='sm'
								color='zinc'
								colorIntensity='400'
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
								className='w-full sm:w-auto sm:min-w-[140px]'>
								<option value='all'>Todos los estados</option>
								<option value='active'>Activas</option>
								<option value='inactive'>Inactivas</option>
							</Select>
						</div>

						{activeFilterCount > 0 && (
							<Button
								size='sm'
								variant='outline'
								color='red'
								onClick={handleClearFilters}
								className='w-full gap-1.5 sm:w-auto'>
								<Icon icon='HeroXMark' className='h-3.5 w-3.5' />
								Limpiar filtros ({activeFilterCount})
							</Button>
						)}
					</div>

					<DataTable
						columns={columns}
						data={filteredRows}
						searchPlaceholder='Buscar categoría...'
						emptyMessage='No hay categorías que coincidan con los filtros'
						enableSearch
						pageSize={10}
					/>
				</CardBody>
			</Card>
		</Container>
	);
};

export default CategoriesTable;
