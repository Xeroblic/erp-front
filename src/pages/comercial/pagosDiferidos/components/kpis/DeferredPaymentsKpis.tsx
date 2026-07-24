import React, { useMemo } from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import type { IDeferredPaymentsSummary } from '@/interface/deferredPayments.interface';
import { formatDeferredPaymentAmount } from '../../utils';

interface DeferredPaymentsKpisProps {
	summary: IDeferredPaymentsSummary | null;
	loading: boolean;
}

const DeferredPaymentsKpis: React.FC<DeferredPaymentsKpisProps> = ({ summary, loading }) => {
	const items = useMemo(
		() => [
			{
				label: 'Total por cobrar',
				amount: summary?.total_outstanding ?? '0',
				detail: 'Saldo vigente',
				icon: 'HeroBanknotes' as const,
				accent: 'bg-blue-600 text-white shadow-sm',
			},
			{
				label: 'Vencido',
				amount: summary?.overdue.amount ?? '0',
				detail: `${summary?.overdue.count ?? 0} documentos`,
				icon: 'HeroExclamationTriangle' as const,
				accent: 'bg-red-600 text-white shadow-sm',
			},
			{
				label: 'Por vencer en 7 d\u00EDas',
				amount: summary?.due_within_7_days.amount ?? '0',
				detail: `${summary?.due_within_7_days.count ?? 0} documentos`,
				icon: 'HeroClock' as const,
				accent: 'bg-amber-600 text-white shadow-sm',
			},
			{
				label: 'Pendiente',
				amount: summary?.pending.amount ?? '0',
				detail: `${summary?.pending.count ?? 0} documentos`,
				icon: 'HeroDocumentText' as const,
				accent: 'bg-zinc-700 text-white shadow-sm',
			},
		],
		[summary],
	);

	return (
		<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
			{items.map((item) => (
				<Card
					key={item.label}
					className='h-full border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
					<CardBody className='flex items-center gap-4'>
						{loading ? (
							<div className='flex w-full animate-pulse items-center gap-4'>
								<div className='h-12 w-12 rounded-2xl bg-zinc-200 dark:bg-zinc-700' />
								<div className='flex-1 space-y-2'>
									<div className='h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700' />
									<div className='h-7 w-32 rounded bg-zinc-200 dark:bg-zinc-700' />
								</div>
							</div>
						) : (
							<>
								<div
									className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${item.accent}`}>
									<Icon icon={item.icon} size='text-3xl' color='white' />
								</div>
								<div className='min-w-0'>
									<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-300'>
										{item.label}
									</p>
									<p className='truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white'>
										{formatDeferredPaymentAmount(item.amount)}
									</p>
									<p className='text-sm text-zinc-500 dark:text-zinc-400'>
										{item.detail}
									</p>
								</div>
							</>
						)}
					</CardBody>
				</Card>
			))}
		</div>
	);
};

export default DeferredPaymentsKpis;
