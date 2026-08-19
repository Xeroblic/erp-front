import React from 'react';
import type { DeferredPaymentStatus } from '@/interface/deferredPayments.interface';
import { DEFERRED_PAYMENT_STATUS_LABELS } from '../../utils';

const colorClasses: Record<DeferredPaymentStatus, string> = {
	pending: 'bg-zinc-600 text-white',
	partially_paid: 'bg-blue-600 text-white',
	paid: 'bg-emerald-600 text-white',
};

interface DeferredStatusPillProps {
	status: DeferredPaymentStatus;
}

const DeferredStatusPill: React.FC<DeferredStatusPillProps> = ({ status }) => (
	<span
		className={`inline-flex min-w-32 max-w-44 items-center justify-center whitespace-normal rounded-full px-3 py-1.5 text-center text-sm font-semibold shadow-sm ${colorClasses[status]}`}>
		{DEFERRED_PAYMENT_STATUS_LABELS[status]}
	</span>
);

export default DeferredStatusPill;
