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
	loading: boolean;
	hasFilters: boolean;
	onPageChange: (page: number) => void;
}

const DeferredPaymentsTable: React.FC<DeferredPaymentsTableProps> = ({
	rows,
	meta,
	loading,
	hasFilters,
	onPageChange,
}) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Documentos por cobrar</CardTitle>
			<span className='text-sm text-zinc-500'>{meta?.total ?? rows.length} documentos</span>
		</CardHeader>
		<CardBody className='overflow-x-auto p-0'>
			<Table className='min-w-[1150px]'>
				<THead>
					<Tr>
						<Th>N&deg; documento</Th>
						<Th>Empresa</Th>
						<Th>OC</Th>
						<Th className='text-right'>Monto</Th>
						<Th className='text-right'>Saldo</Th>
						<Th>Vencimiento</Th>
						<Th className='text-center'>Estado del pago</Th>
						<Th className='text-center'>Situaci&oacute;n de vencimiento</Th>
					</Tr>
				</THead>
				<TBody>
					{loading &&
						Array.from({ length: 5 }, (_, index) => (
							<Tr key={`skeleton-${index}`}>
								{Array.from({ length: 8 }, (__, cellIndex) => (
									<Td key={`skeleton-${index}-${cellIndex}`}>
										<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
									</Td>
								))}
							</Tr>
						))}
					{!loading && rows.length === 0 && (
						<Tr>
							<Td colSpan={8} className='py-12 text-center'>
								<p className='font-medium text-zinc-700 dark:text-zinc-200'>
									{hasFilters
										? 'Sin resultados para los filtros aplicados'
										: 'A\u00FAn no hay documentos de pago diferido'}
								</p>
								<p className='mt-1 text-sm text-zinc-500'>
									{hasFilters
										? 'Prueba ajustando o limpiando los filtros.'
										: 'Los documentos aparecer\u00E1n aqu\u00ED cuando sean registrados.'}
								</p>
							</Td>
						</Tr>
					)}
					{!loading &&
						rows.map((row) => (
							<Tr
								key={row.id}
								className={
									row.is_overdue ? 'border-l-4 border-red-500' : undefined
								}>
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
								<Td>{row.purchase_order ?? '\u2014'}</Td>
								<Td className='text-right tabular-nums'>
									{formatDeferredPaymentAmount(row.total_amount)}
								</Td>
								<Td className='text-right font-semibold tabular-nums'>
									{formatDeferredPaymentAmount(row.outstanding_amount)}
								</Td>
								<Td>{formatDeferredPaymentDate(row.due_date)}</Td>
								<Td>
									<div className='flex justify-center'>
										<DeferredStatusPill status={row.status} />
									</div>
								</Td>
								<Td>
									<div className='flex justify-center'>
										<DaysUntilDueBadge
											daysUntilDue={row.days_until_due}
											isOverdue={row.is_overdue}
										/>
									</div>
								</Td>
							</Tr>
						))}
				</TBody>
			</Table>
		</CardBody>
		{meta && !loading && rows.length > 0 && (
			<div className='flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-700'>
				<p className='text-sm text-zinc-500'>
					P&aacute;gina {meta.current_page} de {meta.last_page}
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
