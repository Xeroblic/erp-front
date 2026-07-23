import React from 'react';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type {
	DeferredPaymentsPaginationMeta,
	IDeferredPaymentListItem,
} from '@/interface/deferredPayments.interface';
import {
	DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS,
	formatDeferredPaymentAmount,
	formatDeferredPaymentDate,
} from '../../utils';
import DaysUntilDueBadge from '../badges/DaysUntilDueBadge';
import DeferredStatusPill from '../badges/DeferredStatusPill';

interface DeferredPaymentsTableProps {
	rows: IDeferredPaymentListItem[];
	meta: DeferredPaymentsPaginationMeta | null;
	onPageChange: (page: number) => void;
}

const DeferredPaymentsTable: React.FC<DeferredPaymentsTableProps> = ({
	rows,
	meta,
	onPageChange,
}) => (
	<Card>
		<CardBody className='overflow-x-auto p-0'>
			<Table className='min-w-[1050px]'>
				<THead>
					<Tr>
						<Th>N° documento</Th>
						<Th>Empresa</Th>
						<Th>OC</Th>
						<Th className='text-right'>Monto</Th>
						<Th className='text-right'>Saldo</Th>
						<Th>Vencimiento</Th>
						<Th>Estado</Th>
						<Th>Días</Th>
					</Tr>
				</THead>
				<TBody>
					{rows.map((row) => (
						<Tr
							key={row.id}
							className={row.is_overdue ? 'border-l-4 border-red-500' : undefined}>
							<Td>
								<p className='font-medium'>{row.document_number}</p>
								<p className='text-xs text-zinc-500'>
									{DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS[row.document_type]}
								</p>
							</Td>
							<Td>
								<p>{row.customer.billing_company}</p>
								<p className='text-xs text-zinc-500'>{row.customer.rut}</p>
							</Td>
							<Td>{row.purchase_order ?? '—'}</Td>
							<Td className='text-right tabular-nums'>
								{formatDeferredPaymentAmount(row.total_amount)}
							</Td>
							<Td className='text-right font-semibold tabular-nums'>
								{formatDeferredPaymentAmount(row.outstanding_amount)}
							</Td>
							<Td>{formatDeferredPaymentDate(row.due_date)}</Td>
							<Td>
								<DeferredStatusPill status={row.status} />
							</Td>
							<Td>
								<DaysUntilDueBadge
									daysUntilDue={row.days_until_due}
									isOverdue={row.is_overdue}
								/>
							</Td>
						</Tr>
					))}
				</TBody>
			</Table>
		</CardBody>
		{meta && (
			<div className='flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-700'>
				<p className='text-sm text-zinc-500'>
					Página {meta.current_page} de {meta.last_page}
				</p>
				<div className='flex gap-2'>
					<Button
						size='sm'
						variant='outline'
						disabled={meta.current_page <= 1}
						onClick={() => onPageChange(meta.current_page - 1)}>
						Anterior
					</Button>
					<Button
						size='sm'
						variant='outline'
						disabled={meta.current_page >= meta.last_page}
						onClick={() => onPageChange(meta.current_page + 1)}>
						Siguiente
					</Button>
				</div>
			</div>
		)}
	</Card>
);

export default DeferredPaymentsTable;
