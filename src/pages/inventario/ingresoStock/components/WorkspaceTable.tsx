import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import Input from '@/components/form/Input';
import DataTable from '@/components/ui/DataTable/DataTable';
import { AppTableFeatures } from '@/components/ui/DataTable/tableFeatures';
import type { IWorkItem } from '../types';

const clpFormatter = new Intl.NumberFormat('es-CL', {
	style: 'currency',
	currency: 'CLP',
	maximumFractionDigits: 0,
});

const QuantityInputCell = ({
	initialQuantity,
	productId,
	onCommit,
}: {
	initialQuantity: string;
	productId: number;
	onCommit: (productId: number, newQuantity: string) => void;
}) => {
	const [draft, setDraft] = useState(initialQuantity);

	useEffect(() => {
		setDraft(initialQuantity);
	}, [initialQuantity]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const numericOnly = e.target.value.replace(/[^0-9]/g, '');
		setDraft(numericOnly);
	};

	const handleCommit = () => {
		const parsed = Number(draft);
		const safe = Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '1';
		setDraft(safe);
		onCommit(productId, safe);
	};

	return (
		<div className='w-28'>
			<Input
				name={`qty-${productId}`}
				type='text'
				inputMode='numeric'
				value={draft}
				onChange={handleChange}
				onBlur={handleCommit}
				onKeyDown={(e) => {
					if (e.key === '-' || e.key === 'e' || e.key === 'E') {
						e.preventDefault();
					}
					if (e.key === 'Enter') {
						e.currentTarget.blur();
					}
				}}
			/>
		</div>
	);
};

interface WorkspaceTableProps {
	items: IWorkItem[];
	getSignedQuantity: (quantity: string) => number;
	onQuantityChange: (productId: number, quantity: string) => void;
	onRemoveItem: (productId: number) => void;
}

export const WorkspaceTable = ({
	items,
	getSignedQuantity,
	onQuantityChange,
	onRemoveItem,
}: WorkspaceTableProps) => {
	const columns = useMemo<ColumnDef<AppTableFeatures, IWorkItem, unknown>[]>(
		() => [
			{
				id: 'product',
				header: 'Producto',
				cell: ({ row }) => (
					<div className='flex items-center gap-3'>
						<div className='flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400'>
							<Icon icon='HeroCube' className='h-4 w-4' />
						</div>
						<div className='min-w-0 max-w-[280px]'>
							<p
								className='line-clamp-2 break-words font-semibold'
								title={row.original.name}>
								{row.original.name}
							</p>
							<p className='break-all font-mono text-[11px] text-zinc-500'>
								SKU: {row.original.sku}
							</p>
						</div>
					</div>
				),
			},
			{
				id: 'stock',
				header: 'Stock actual',
				cell: ({ row }) => (
					<span className='font-medium text-neutral-700 dark:text-neutral-200'>
						{row.original.stock} u.
					</span>
				),
			},
			{
				id: 'price',
				header: 'Precio',
				cell: ({ row }) => (
					<span className='font-semibold text-neutral-800 dark:text-neutral-100'>
						{clpFormatter.format(Number(row.original.price ?? 0))}
					</span>
				),
			},
			{
				id: 'quantity',
				header: 'Cantidad',
				cell: ({ row }) => (
					<QuantityInputCell
						initialQuantity={row.original.quantity}
						productId={row.original.productId}
						onCommit={onQuantityChange}
					/>
				),
			},
			{
				id: 'adjustment',
				header: 'Ajuste resultante',
				cell: ({ row }) => {
					const signedQuantity = getSignedQuantity(row.original.quantity);
					const isIngreso = signedQuantity > 0;
					return (
						<Tooltip
							text={
								isIngreso
									? `Ingreso: suma ${signedQuantity} unidad(es) al stock.`
									: `Salida/merma: resta ${Math.abs(signedQuantity)} unidad(es) del stock.`
							}>
							<span className='inline-flex'>
								<Badge
									color={isIngreso ? 'emerald' : 'red'}
									variant='solid'
									className='inline-flex items-center gap-1'>
									<Icon
										icon={
											isIngreso
												? 'HeroArrowTrendingUp'
												: 'HeroArrowTrendingDown'
										}
										className='h-3 w-3'
									/>
									{isIngreso ? `+${signedQuantity}` : signedQuantity}
								</Badge>
							</span>
						</Tooltip>
					);
				},
			},
			{
				id: 'action',
				header: 'Acción',
				cell: ({ row }) => (
					<Tooltip text='Quitar este producto de la zona de trabajo'>
						<Button
							color='red'
							variant='solid'
							size='sm'
							icon='HeroTrash'
							onClick={() => onRemoveItem(row.original.productId)}>
							Quitar
						</Button>
					</Tooltip>
				),
			},
		],
		[getSignedQuantity, onQuantityChange, onRemoveItem],
	);

	return (
		<DataTable<IWorkItem>
			columns={columns}
			data={items}
			enableSearch={false}
			pageSize={10}
			emptyMessage='Agrega productos desde la tabla principal para iniciar el ajuste.'
			tableContainerClassName='max-h-[50vh] overflow-y-auto'
			stickyHeader
		/>
	);
};
