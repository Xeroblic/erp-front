import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable/DataTable';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { TColors } from '@/types/colors.type';
import type { IProduct } from '@/interface/product.interface';
import { useProductReviews } from './hooks/useProductReviews';
import type { ProductReviewRow } from './types';
import {
	EQUIPMENT_TYPE_LABEL,
	INVENTORY_STATUS_LABEL,
	REVIEW_STATUS_LABEL,
	humanizeStatus,
} from './types';

interface ReviewsTabProps {
	product: IProduct;
}

const REVIEW_STATUS_COLOR: Record<string, TColors> = {
	pending: 'neutral',
	received: 'sky',
	in_review: 'amber',
	reviewed: 'green',
	approved: 'emerald',
};

const INVENTORY_STATUS_COLOR: Record<string, TColors> = {
	available: 'emerald',
	available_for_sale: 'emerald',
	reserved: 'amber',
	sold: 'blue',
	defective: 'red',
	returned: 'orange',
	scrapped: 'stone',
};

const inventoryColor = (value: string | null): TColors =>
	(value && INVENTORY_STATUS_COLOR[value]) || 'neutral';

const GRADE_COLOR: Record<string, TColors> = {
	A: 'emerald',
	B: 'blue',
	C: 'amber',
	D: 'orange',
	M: 'neutral',
};

const gradeColor = (grade: string): TColors => GRADE_COLOR[grade] ?? 'stone';

const formatDate = (value: string | null): string => {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';
	return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const inventoryLabel = (value: string | null): string => {
	if (!value) return '—';
	return INVENTORY_STATUS_LABEL[value] ?? value;
};

const ReviewsTab: React.FC<ReviewsTabProps> = ({ product }) => {
	const navigate = useNavigate();

	// El endpoint de series devuelve TODO el árbol cuando se pide el id del
	// producto padre (todas las variantes/grados), así que no hace falta pedir
	// también cada hijo: basta con el id actual y evitamos N peticiones extra.
	const productIds = useMemo(() => [product.id], [product.id]);

	const { rows, total, reviewedCount, pendingCount, gradeBreakdown, isLoading, error, reload } =
		useProductReviews(productIds);

	const categoryName = product.categories?.[0]?.name ?? null;

	const columns = useMemo<ColumnDef<ProductReviewRow>[]>(
		() => [
			{
				header: 'Serie',
				accessorKey: 'serialNumber',
				cell: ({ row }) => (
					<span className='font-mono font-medium text-neutral-800 dark:text-neutral-100'>
						{row.original.serialNumber}
					</span>
				),
			},
			{
				header: 'Tipo de equipo',
				accessorKey: 'equipmentType',
				cell: ({ row }) => {
					const { equipmentType } = row.original;
					if (!equipmentType) {
						return <span className='text-neutral-400'>Sin clasificar</span>;
					}
					return (
						<span className='text-neutral-600 dark:text-neutral-300'>
							{EQUIPMENT_TYPE_LABEL[equipmentType] ?? humanizeStatus(equipmentType)}
						</span>
					);
				},
			},
			{
				header: 'Estado revisión',
				accessorKey: 'reviewStatus',
				cell: ({ row }) => {
					const { reviewStatus } = row.original;
					if (!reviewStatus) {
						return (
							<Badge variant='outline' color='stone'>
								Sin revisión
							</Badge>
						);
					}
					return (
						<Badge variant='solid' color={REVIEW_STATUS_COLOR[reviewStatus] ?? 'sky'}>
							{REVIEW_STATUS_LABEL[reviewStatus] ?? humanizeStatus(reviewStatus)}
						</Badge>
					);
				},
			},
			{
				header: 'Grado',
				accessorKey: 'grade',
				cell: ({ row }) => {
					const { grade } = row.original;
					return grade ? (
						<Badge variant='outline' color={gradeColor(grade)}>
							{grade}
						</Badge>
					) : (
						<span className='text-neutral-400'>—</span>
					);
				},
			},
			{
				header: 'Inventario',
				accessorKey: 'inventoryStatus',
				cell: ({ row }) => {
					const { inventoryStatus, branchName } = row.original;
					if (!inventoryStatus) {
						return <span className='text-neutral-400'>—</span>;
					}
					return (
						<div>
							<Badge variant='solid' color={inventoryColor(inventoryStatus)}>
								{inventoryLabel(inventoryStatus)}
							</Badge>
							{branchName && (
								<span className='mt-1 block text-xs text-neutral-400'>
									{branchName}
								</span>
							)}
						</div>
					);
				},
			},
			{
				header: 'Revisado',
				accessorKey: 'reviewedAt',
				cell: ({ row }) => (
					<span className='text-neutral-600 dark:text-neutral-300'>
						{formatDate(row.original.reviewedAt)}
					</span>
				),
			},
			{
				id: 'actions',
				header: 'Acciones',
				enableSorting: false,
				cell: ({ row }) => (
					<div className='text-right'>
						<Button
							variant='outline'
							color='blue'
							size='sm'
							icon='HeroArrowTopRightOnSquare'
							onClick={() =>
								navigate(
									`/technical-reviews/traceability/${row.original.serialNumber}`,
								)
							}>
							Ver revisión
						</Button>
					</div>
				),
			},
		],
		[navigate],
	);

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center gap-2 text-sm'>
				<span className='inline-flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-200'>
					<Icon icon='HeroClipboardDocumentCheck' className='h-4 w-4 text-blue-500' />
					{total} {total === 1 ? 'unidad' : 'unidades'}
				</span>
				<Badge variant='outline' color='emerald'>
					{reviewedCount} revisadas
				</Badge>
				<Badge variant='outline' color='amber'>
					{pendingCount} pendientes
				</Badge>
				{categoryName && (
					<Badge variant='outline' color='blue'>
						Categoría: {categoryName}
					</Badge>
				)}
				{gradeBreakdown.length > 0 && (
					<span className='ml-1 inline-flex flex-wrap items-center gap-1.5'>
						<span className='text-xs text-neutral-400'>Grados:</span>
						{gradeBreakdown.map((entry) => (
							<Badge
								key={entry.grade}
								variant='outline'
								color={gradeColor(entry.grade)}>
								{entry.grade}: {entry.count}
							</Badge>
						))}
					</span>
				)}
			</div>

			{error && (
				<div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200'>
					{error}
				</div>
			)}

			<DataTable
				columns={columns}
				data={rows}
				loading={isLoading}
				pageSize={15}
				searchPlaceholder='Buscar serie...'
				emptyMessage='Este producto no tiene series registradas.'
				actions={
					<Button
						variant='outline'
						color='blue'
						size='sm'
						icon='HeroArrowPath'
						onClick={reload}
						isDisable={isLoading}>
						Actualizar
					</Button>
				}
			/>
		</div>
	);
};

export default ReviewsTab;
