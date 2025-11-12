/**
 * ItemList - Tabla reutilizable de series/ítems
 * Usado en: pages/items/index.tsx y BatchTabs.tsx
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Table, { THead, TBody, Tr, Th, Td } from '@/components/ui/Table';
import Icon from '@/components/icon/Icon';
import type { IItem, ListMeta } from '@/interface/technicalReviews.interface';
import StatusBadge from '../shared/StatusBadge';
import { useAppDispatch } from '@/store';
import { deleteItem } from '@/store/slices/technicalReviews';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { toast } from 'react-toastify';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    OnChangeFn,
    PaginationState,
    useReactTable,
} from '@tanstack/react-table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

interface ItemListProps {
	items: IItem[];
	loading: boolean;
	meta: ListMeta;
	onPageChange?: (page: number) => void;
	onLimitChange?: (limit: number) => void;
	onItemClick?: (itemId: number) => void;
	baseUrl?: string; // URL base para navegación (ej: '/technical-reviews/items' o '/technical-reviews/batches/5')
	emptyMessage?: string;
	variant?: 'batch' | 'global';
}

const ItemList: React.FC<ItemListProps> = ({
	items,
	loading,
	meta,
	onPageChange,
	onLimitChange,
	onItemClick,
	baseUrl = '/technical-reviews/items',
	emptyMessage = 'No hay series para mostrar',
	variant = 'batch',
}) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { branchId } = useCurrentBranch();

	// Helper para extraer valor de objetos {value, label, description} o devolver el valor directamente
	const extractValue = (value: any): string | null => {
		if (value == null) return null;
		if (typeof value === 'string' || typeof value === 'number') return String(value);
		if (typeof value === 'object' && 'value' in value) return String(value.value);
		return String(value);
	};

    const handleItemClick = (itemId: number) => {
        if (onItemClick) {
            onItemClick(itemId);
        } else {
            navigate(`${baseUrl}/${itemId}`);
        }
    };

    const handleDelete = async (itemId: number) => {
        if (!branchId) {
            toast.error('No hay sucursal activa para eliminar la revisión');
            return;
        }
        const ok = window.confirm('¿Eliminar esta revisión? Esta acción no se puede deshacer.');
        if (!ok) return;
        try {
            await dispatch(deleteItem({ branchId, itemId })).unwrap();
            toast.success('Revisión eliminada');
            onPageChange?.(meta.current_page);
        } catch (err: any) {
            toast.error(err?.message || 'No se pudo eliminar la revisión');
        }
    };

	const resolveEquipmentTypeMeta = (
		equipmentType: any,
	): { value: string; label: string; icon: string } => {
		const value = (
			typeof equipmentType === 'object' && equipmentType !== null && 'value' in equipmentType
				? equipmentType.value
				: equipmentType
		) as string | null;

		const normalizedValue = value ?? 'unknown';

		if (
			typeof equipmentType === 'object' &&
			equipmentType !== null &&
			'label' in equipmentType &&
			equipmentType.label
		) {
			return {
				value: normalizedValue,
				label: String(equipmentType.label),
				icon:
					normalizedValue === 'notebook'
						? 'HeroComputerDesktop'
						: normalizedValue === 'desktop'
							? 'HeroServerStack'
							: normalizedValue === 'aio'
								? 'HeroDeviceTablet'
								: normalizedValue === 'docking'
									? 'HeroCpuChip'
									: 'HeroTv',
			};
		}

		const label =
			normalizedValue === 'notebook'
				? 'Notebook'
				: normalizedValue === 'desktop'
					? 'Desktop'
					: normalizedValue === 'aio'
						? 'AIO'
						: normalizedValue === 'docking'
							? 'Docking'
							: normalizedValue === 'monitor'
								? 'Monitor'
								: 'Desconocido';

		const icon =
			normalizedValue === 'notebook'
				? 'HeroComputerDesktop'
				: normalizedValue === 'desktop'
					? 'HeroServerStack'
					: normalizedValue === 'aio'
						? 'HeroDeviceTablet'
						: normalizedValue === 'docking'
							? 'HeroCpuChip'
							: 'HeroTv';

		return { value: normalizedValue, label, icon };
	};

	const formatDateTime = (value?: string | null): string => {
		if (!value) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleString('es-CL', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	};

	if (loading) {
		return (
			<Card>
				<CardBody className='p-8'>
					<div className='flex items-center justify-center'>
						<Icon
							icon='HeroArrowPath'
							className='mr-2 h-6 w-6 animate-spin text-blue-600'
						/>
						<span className='text-gray-600 dark:text-gray-400'>Cargando series...</span>
					</div>
				</CardBody>
			</Card>
		);
	}

	if (!items || items.length === 0) {
		return (
			<Card>
				<CardBody className='p-8'>
					<div className='text-center'>
						<Icon
							icon='HeroInboxStack'
							className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-600'
						/>
						<p className='mt-2 text-gray-600 dark:text-gray-400'>{emptyMessage}</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	// TanStack Table setup
	const columnHelper = useMemo(() => createColumnHelper<IItem>(), []);

	const columns = useMemo(() => {
		const cols = [
			columnHelper.display({
				id: 'serial_number',
				header: 'Serie',
				cell: (info) => {
					const item = info.row.original;
					return (
						<div className='flex items-center gap-2'>
							<Icon icon='HeroQrCode' className='h-4 w-4 text-gray-400' />
							<span className='font-mono text-sm font-medium text-gray-900 dark:text-gray-100'>
								{item.serial_number}
							</span>
						</div>
					);
				},
			}),

			// Tipo
			columnHelper.display({
				id: 'equipment_type',
				header: 'Tipo',
				cell: (info) => {
					const item = info.row.original;
					const { label, icon } = resolveEquipmentTypeMeta(item.equipment_type);
					return (
						<span className='inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'>
							<Icon icon={icon as any} className='h-3 w-3' />
							{label}
						</span>
					);
				},
			}),

			// Estado revisión
			columnHelper.display({
				id: 'review_status',
				header: 'Estado Revisión',
				cell: (info) => <StatusBadge type='review' status={info.row.original.review_status} />,
			}),

			// Estado comercial
			columnHelper.display({
				id: 'current_status',
				header: 'Estado Comercial',
				cell: (info) => (
					<StatusBadge type='commercial' status={info.row.original.current_status} />
				),
			}),

			// Grado
			columnHelper.display({
				id: 'grade',
				header: 'Grado',
				cell: (info) => {
					const item = info.row.original;
					return extractValue(item.grade) ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>
							<Icon icon='HeroStar' className='h-3 w-3' />
							{extractValue(item.grade)}
							{extractValue(item.suggested_grade) &&
								extractValue(item.grade) !== extractValue(item.suggested_grade) && (
								<span className='text-[10px] text-yellow-600 dark:text-yellow-400'>
									(Sugerido: {extractValue(item.suggested_grade)})
								</span>
							)}
						</span>
					) : extractValue(item.suggested_grade) ? (
						<span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400'>
							<Icon icon='HeroSparkles' className='h-3 w-3' />
							{extractValue(item.suggested_grade)}
						</span>
					) : (
						<span className='text-xs text-gray-400'>Pendiente</span>
					);
				},
			}),
		] as any[];

		if (variant === 'global') {
			cols.splice(1, 0,
				// Producto (solo global)
				columnHelper.display({
					id: 'product_name',
					header: 'Producto',
					cell: (info) => {
						const item = info.row.original as any;
						return (
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{item?.product?.name || item?.product_name || 'Sin producto'}
							</span>
						);
					},
				}),
			);

			cols.push(
				// Bodega (solo global)
				columnHelper.display({
					id: 'warehouse_name',
					header: 'Bodega',
					cell: (info) => {
						const item = info.row.original as any;
						return (
							<span className='text-sm text-gray-700 dark:text-gray-300'>
								{item?.warehouse?.name || item?.warehouse_name || '—'}
							</span>
						);
					},
				}),
				// Última actualización (solo global)
				columnHelper.display({
					id: 'updated_at',
					header: 'Última actualización',
					cell: (info) => (
						<span className='text-sm text-gray-600 dark:text-gray-400'>
							{formatDateTime(info.row.original.updated_at || info.row.original.created_at)}
						</span>
					),
				}),
			);
		}

		// Acciones
		cols.push(
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => {
					const item = info.row.original;
					const reviewStatus = (extractValue(item.review_status) || '').toLowerCase();
					const isApproved = reviewStatus === 'approved';
					return (
						<div className='inline-flex w-full justify-end gap-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									handleItemClick(item.id);
								}}>
								<Icon icon='HeroEye' className='h-4 w-4' />
							</Button>
							<Button
								variant='outline'
								size='sm'
								color='red'
								isDisable={isApproved}
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(item.id);
								}}
								title={isApproved ? 'No se puede eliminar una revisión aprobada' : 'Eliminar revisión'}>
								<Icon icon='HeroTrash' className='h-4 w-4' />
							</Button>
						</div>
					);
				},
			}),
		);

		return cols;
	}, [columnHelper, variant]);

	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const current: PaginationState = {
			pageIndex: Math.max((meta?.current_page || 1) - 1, 0),
			pageSize: meta?.per_page || 10,
		};
		const next = typeof updater === 'function' ? updater(current) : updater;

		if (next.pageSize !== current.pageSize) {
			onLimitChange?.(next.pageSize);
			return;
		}

		if (next.pageIndex !== current.pageIndex) {
			onPageChange?.(next.pageIndex + 1);
		}
	};

	const table = useReactTable({
		data: items,
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination: {
				pageIndex: Math.max((meta?.current_page || 1) - 1, 0),
				pageSize: meta?.per_page || 10,
			},
		},
		onPaginationChange: handlePaginationChange,
		manualPagination: true,
		pageCount: meta?.last_page || 1,
	});

	return (
		<div className='space-y-4'>
			<Card>
				<CardBody className='overflow-x-auto p-0'>
					<Table className='w-full'>
						<THead className='bg-gray-50 dark:bg-gray-800'>
							{table.getHeaderGroups().map((headerGroup) => (
								<Tr key={headerGroup.id} className='select-none'>
									{headerGroup.headers.map((header) => (
										<Th
											key={header.id}
											className='text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300'>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</Th>
									))}
								</Tr>
							))}
						</THead>
						<TBody className='bg-white dark:bg-gray-900'>
							{table.getRowModel().rows.map((row, index) => (
								<Tr
									key={row.id}
									className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-zinc-50/30 dark:bg-zinc-800/20'}`}
									onClick={() => handleItemClick(row.original.id)}>
									{row.getVisibleCells().map((cell) => (
										<Td key={cell.id} className='align-middle'>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
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
		</div>
	);
};

export default ItemList;
