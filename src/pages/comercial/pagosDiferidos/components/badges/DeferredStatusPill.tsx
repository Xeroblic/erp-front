import React from 'react';
import type { DeferredPaymentStatus } from '@/interface/deferredPayments.interface';
import { DEFERRED_PAYMENT_STATUS_LABELS } from '../../utils';

const colorClasses: Record<DeferredPaymentStatus, string> = {
	pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
	partially_paid: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
	paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
};

interface DeferredStatusPillProps {
	status: DeferredPaymentStatus;
}

const DeferredStatusPill: React.FC<DeferredStatusPillProps> = ({ status }) => (
	<span
		className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colorClasses[status]}`}>
		{DEFERRED_PAYMENT_STATUS_LABELS[status]}
	</span>
);

export default DeferredStatusPill;
