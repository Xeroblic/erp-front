import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import type { TIcons } from '@/types/icons.type';
import type { IInventoryStockRow } from '@/interface/procurement.interface';

interface IStockSummaryKpisProps {
	summaryRow: IInventoryStockRow;
}

interface IStockSummaryKpiItem {
	key: keyof Pick<
		IInventoryStockRow,
		| 'physical_quantity'
		| 'fit_quantity'
		| 'unfit_quantity'
		| 'documented_quantity'
		| 'undocumented_quantity'
	>;
	label: string;
	icon: TIcons;
	accent: string;
}

const KPI_ITEMS: IStockSummaryKpiItem[] = [
	{ key: 'physical_quantity', label: 'Físico', icon: 'HeroCube', accent: 'bg-blue-600' },
	{ key: 'fit_quantity', label: 'Apto', icon: 'HeroCheckCircle', accent: 'bg-emerald-600' },
	{
		key: 'unfit_quantity',
		label: 'No apto',
		icon: 'HeroExclamationTriangle',
		accent: 'bg-amber-600',
	},
	{
		key: 'documented_quantity',
		label: 'Documentado',
		icon: 'HeroDocumentCheck',
		accent: 'bg-violet-600',
	},
	{
		key: 'undocumented_quantity',
		label: 'Sin documento',
		icon: 'HeroDocumentMinus',
		accent: 'bg-zinc-600',
	},
];

/** Mismo estilo de caja+ícono que `DeferredPaymentsKpis` de pagos diferidos, aplicado a los cinco desgloses de stock (sección 8 del contrato). */
const StockSummaryKpis: React.FC<IStockSummaryKpisProps> = ({ summaryRow }) => (
	<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
		{KPI_ITEMS.map((item) => (
			<Card
				key={item.key}
				className='h-full border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
				<CardBody className='flex items-center gap-4'>
					<div
						className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${item.accent}`}>
						<Icon icon={item.icon} size='text-3xl' color='white' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-300'>
							{item.label}
						</p>
						<p className='truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white'>
							{summaryRow[item.key]}
						</p>
					</div>
				</CardBody>
			</Card>
		))}
	</div>
);

export default React.memo(StockSummaryKpis);
