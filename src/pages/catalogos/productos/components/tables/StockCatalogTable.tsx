import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable';

interface StockCatalogTableProps {
	items: Record<string, unknown>[];
	loading?: boolean;
}

interface StockCatalogRow {
	id: string;
	productId: number | null;
	name: string;
	sku: string;
	availableStock: number;
	distributedStock: number;
	totalStock: number;
	branchesCount: number;
	serialTracking: boolean;
	reservedStock: number;
	onHoldStock: number;
	inQuotationStock: number;
	soldStock: number;
	gradesCount: number;
	gradeSummary: Array<{ label: string; quantity: number }>;
	branchSummary: Array<{ label: string; quantity: number }>;
	gradesPreview: string;
	distributionPreview: string;
	statusPreview: string;
}

const toNumber = (...values: unknown[]): number => {
	for (const value of values) {
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string' && value.trim() !== '') {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) return parsed;
		}
	}
	return 0;
};

const toString = (...values: unknown[]): string => {
	for (const value of values) {
		if (typeof value === 'string' && value.trim().length > 0) return value;
		if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	}
	return '';
};

const toBoolean = (...values: unknown[]): boolean => {
	for (const value of values) {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'number') return value > 0;
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			if (['true', '1', 'yes', 'si'].includes(normalized)) return true;
			if (['false', '0', 'no'].includes(normalized)) return false;
		}
	}
	return false;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
};

const sumNumbersFromList = (items: unknown[], picker: (item: Record<string, unknown>) => number): number =>
	items.reduce<number>((total, item) => {
		const record = toRecord(item);
		if (!record) return total;
		return total + picker(record);
	}, 0);

const extractGrades = (value: unknown): Record<string, Record<string, unknown>> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return Object.entries(value as Record<string, unknown>).reduce<Record<string, Record<string, unknown>>>(
		(acc, [gradeKey, gradeValue]) => {
			const record = toRecord(gradeValue);
			if (record) acc[gradeKey] = record;
			return acc;
		},
		{},
	);
};

const getQuantityTone = (quantity: number): 'emerald' | 'amber' | 'red' | 'blue' => {
	if (quantity <= 0) return 'red';
	if (quantity <= 3) return 'amber';
	if (quantity >= 10) return 'blue';
	return 'emerald';
};

/**
 * Desglose de estados de stock con etiqueta clara + tooltip. Reemplaza los
 * códigos crípticos (R/E/C/V) por nombres legibles. El orden refleja el ciclo
 * de vida de una unidad: reservada → apartada → cotizada → vendida.
 */
const STOCK_STATUS_META: Array<{
	key: 'reservedStock' | 'onHoldStock' | 'inQuotationStock' | 'soldStock';
	label: string;
	color: string;
	help: string;
}> = [
	{
		key: 'reservedStock',
		label: 'Reservado',
		color: 'indigo',
		help: 'Unidades reservadas para una venta confirmada.',
	},
	{
		key: 'onHoldStock',
		label: 'En espera',
		color: 'amber',
		help: 'Unidades apartadas temporalmente por ventas en proceso (soft-hold).',
	},
	{
		key: 'inQuotationStock',
		label: 'En cotización',
		color: 'sky',
		help: 'Unidades comprometidas en una cotización.',
	},
	{
		key: 'soldStock',
		label: 'Vendido',
		color: 'emerald',
		help: 'Unidades ya vendidas.',
	},
];

const StockStatusBreakdown = ({
	row,
	onOpenDetail,
}: {
	row: StockCatalogRow;
	onOpenDetail?: () => void;
}) => {
	const active = STOCK_STATUS_META.filter((meta) => row[meta.key] > 0);

	if (active.length === 0) {
		return (
			<Tooltip text='Este producto no tiene unidades reservadas, apartadas, en cotización ni vendidas.'>
				<Badge variant='outline' color='zinc' className='w-fit'>
					Sin novedades
				</Badge>
			</Tooltip>
		);
	}

	return (
		<div className='flex flex-wrap gap-1.5'>
			{active.map((meta) => {
				// "En espera" (apartadas/soft-hold) enlaza al detalle del producto,
				// donde cada unidad apartada muestra y enlaza a su venta asociada.
				const isLinkable = meta.key === 'onHoldStock' && Boolean(onOpenDetail);
				const tooltipText = isLinkable
					? `${meta.label}: ${row[meta.key]} — ${meta.help} Click para ver el detalle y las ventas que apartan el stock.`
					: `${meta.label}: ${row[meta.key]} — ${meta.help}`;

				const badge = (
					<Badge
						variant='outline'
						color={meta.color}
						className={`inline-flex items-center gap-1 whitespace-nowrap ${
							isLinkable ? 'transition-[filter] hover:brightness-110' : ''
						}`}>
						<span className='font-medium'>{meta.label}</span>
						<strong>{row[meta.key]}</strong>
						{isLinkable && (
							<Icon icon='HeroArrowTopRightOnSquare' className='h-3 w-3' />
						)}
					</Badge>
				);

				return (
					<Tooltip key={meta.key} text={tooltipText} placement='top'>
						{isLinkable ? (
							<button
								type='button'
								onClick={onOpenDetail}
								className='cursor-pointer'
								aria-label={`Ver detalle de ${row.name} y las ventas que apartan stock`}>
								{badge}
							</button>
						) : (
							badge
						)}
					</Tooltip>
				);
			})}
		</div>
	);
};

const normalizeCatalogRow = (item: Record<string, unknown>, index: number): StockCatalogRow => {
	const grades = extractGrades(item.grades);
	const gradeEntries = Object.entries(grades);
	const productId = toNumber(item.product_id, item.id);
	const availableStock = gradeEntries.reduce(
		(total, [, grade]) => total + toNumber(grade.total_available, toRecord(grade.stock_status)?.available),
		0,
	);
	const soldStock = gradeEntries.reduce(
		(total, [, grade]) => total + toNumber(grade.total_sold, toRecord(grade.stock_status)?.sold),
		0,
	);
	const reservedStock = gradeEntries.reduce(
		(total, [, grade]) => total + toNumber(toRecord(grade.stock_status)?.reserved),
		0,
	);
	const onHoldStock = gradeEntries.reduce(
		(total, [, grade]) => total + toNumber(toRecord(grade.stock_status)?.on_hold),
		0,
	);
	const inQuotationStock = gradeEntries.reduce(
		(total, [, grade]) => total + toNumber(toRecord(grade.stock_status)?.in_quotation),
		0,
	);
	const distributedStock = gradeEntries.reduce((total, [, grade]) => {
		const branches = Array.isArray(grade.branches) ? grade.branches : [];
		return (
			total +
			sumNumbersFromList(branches, (branch) => toNumber(branch.quantity, toRecord(branch.stock_status)?.available))
		);
	}, 0);
	const branchMap = new Map<number, { name: string; quantity: number }>();
	for (const [, grade] of gradeEntries) {
		const branches = Array.isArray(grade.branches) ? grade.branches : [];
		for (const branch of branches) {
			const record = toRecord(branch);
			if (!record) continue;
			const branchId = toNumber(record.branch_id);
			if (!branchId) continue;
			const current = branchMap.get(branchId);
			branchMap.set(branchId, {
				name: toString(record.branch_name, current?.name, `Sucursal ${branchId}`),
				quantity: (current?.quantity ?? 0) + toNumber(record.quantity, toRecord(record.stock_status)?.available),
			});
		}
	}
	const branchesCount = branchMap.size;
	const totalStock = availableStock + reservedStock + onHoldStock + inQuotationStock + soldStock;
	const gradeSummary = gradeEntries.map(([gradeKey, grade]) => {
		const quantity = toNumber(grade.total_available, toRecord(grade.stock_status)?.available);
		return { label: gradeKey, quantity };
	});
	const branchSummary = Array.from(branchMap.values()).map(
		(branch) => ({ label: branch.name, quantity: branch.quantity }),
	);
	const gradesPreview = gradeSummary.map((grade) => `${grade.label}:${grade.quantity}`).join(' · ');
	const topBranch = branchSummary[0];
	const distributionPreview = topBranch
		? branchSummary.length > 1
			? `${topBranch.label}: ${topBranch.quantity} +${branchSummary.length - 1}`
			: `${topBranch.label}: ${topBranch.quantity}`
		: 'Sin sucursales';
	const statusPreview = [
		reservedStock > 0 ? `R ${reservedStock}` : null,
		onHoldStock > 0 ? `E ${onHoldStock}` : null,
		inQuotationStock > 0 ? `C ${inQuotationStock}` : null,
		soldStock > 0 ? `V ${soldStock}` : null,
	]
		.filter((value): value is string => Boolean(value))
		.join(' · ');

	return {
		id: String(productId || index + 1),
		productId: productId || null,
		name: toString(item.product_name, item.name, `Producto ${index + 1}`),
		sku: toString(item.sku, 'Sin SKU'),
		availableStock,
		distributedStock,
		totalStock,
		branchesCount,
		serialTracking: toBoolean(item.serial_tracking),
		reservedStock,
		onHoldStock,
		inQuotationStock,
		soldStock,
		gradesCount: gradeEntries.length,
		gradeSummary,
		branchSummary,
		gradesPreview,
		distributionPreview,
		statusPreview,
	};
};

const StockCatalogTable = ({ items, loading = false }: StockCatalogTableProps) => {
	const navigate = useNavigate();

	const rows = useMemo(
		() => items.map(normalizeCatalogRow).filter((row) => row.name.trim().length > 0),
		[items],
	);

	const openProductDetail = useCallback(
		(productId: number | null) => {
			if (productId) navigate(`/catalogos/productos/${productId}`);
		},
		[navigate],
	);

	const columns = useMemo<ColumnDef<StockCatalogRow>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'Producto',
				cell: ({ row }) => (
					<div className='space-y-1'>
						{row.original.productId ? (
							<button
								type='button'
								onClick={() => openProductDetail(row.original.productId)}
								className='group inline-flex items-center gap-1 text-left font-semibold text-neutral-900 transition-colors hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400'>
								<span>{row.original.name}</span>
								<Icon
									icon='HeroArrowTopRightOnSquare'
									className='h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-blue-500 dark:text-neutral-600'
								/>
							</button>
						) : (
							<p className='font-semibold text-neutral-900 dark:text-neutral-100'>
								{row.original.name}
							</p>
						)}
						<div className='flex flex-wrap items-center gap-2 text-[11px] text-neutral-500'>
							<span>SKU: {row.original.sku}</span>
							<span>ID: {row.original.productId ?? 'N/D'}</span>
						</div>
						<div>
							<Badge
								variant='outline'
								color={row.original.serialTracking ? 'emerald' : 'zinc'}
								className='w-fit'>
								{row.original.serialTracking ? 'Serializado' : 'Estándar'}
							</Badge>
						</div>
					</div>
				),
			},
			{
				accessorKey: 'availableStock',
				header: 'Disponible',
				cell: ({ row }) => (
					<div className='min-w-[64px]'>
						<p className='text-lg font-semibold leading-none text-neutral-900 dark:text-neutral-100'>
							{row.original.availableStock}
						</p>
					</div>
				),
			},
			{
				accessorKey: 'distributedStock',
				header: 'Distribuido',
				cell: ({ row }) => (
					<div className='min-w-[78px]'>
						<p className='text-base font-semibold text-neutral-900 dark:text-neutral-100'>
							{row.original.distributedStock}
						</p>
						<p className='text-[11px] text-neutral-400'>Sucursales: {row.original.branchesCount}</p>
					</div>
				),
			},
			{
				id: 'grades',
				header: 'Grados',
				cell: ({ row }) => (
					<div className='max-w-[180px]'>
						<p className='text-xs font-medium text-neutral-700 dark:text-neutral-200'>
							{row.original.gradesCount} grados
						</p>
						<p className='mt-1 truncate text-[11px] text-neutral-500'>
							{row.original.gradesPreview || 'Sin grados'}
						</p>
					</div>
				),
			},
			{
				accessorKey: 'totalStock',
				header: 'Stock total',
				cell: ({ row }) => (
					<div className='min-w-[78px]'>
						<Tooltip text='Stock total = disponible + reservado + en espera + en cotización + vendido. Ver el desglose en la columna Estados.'>
							<p className='inline-block cursor-help text-base font-semibold text-neutral-900 underline decoration-dotted underline-offset-4 dark:text-neutral-100'>
								{row.original.totalStock}
							</p>
						</Tooltip>
						<p className='text-[11px] text-neutral-400'>
							{row.original.availableStock} disponibles
						</p>
					</div>
				),
			},
			{
				id: 'distribution',
				header: 'Distribución',
				cell: ({ row }) => (
					<div className='max-w-[160px]'>
						<p className='truncate text-[11px] text-neutral-500'>
							{row.original.distributionPreview}
						</p>
					</div>
				),
			},
			{
				id: 'statusBreakdown',
				header: 'Estados',
				cell: ({ row }) => (
					<StockStatusBreakdown
						row={row.original}
						onOpenDetail={() => openProductDetail(row.original.productId)}
					/>
				),
			},
		],
		[openProductDetail],
	);

	return (
		<DataTable
			columns={columns}
			data={rows}
			loading={loading}
			emptyMessage='No hay datos disponibles en el catálogo de stock.'
			searchPlaceholder='Buscar por producto o SKU...'
		/>
	);
};

export default StockCatalogTable;
