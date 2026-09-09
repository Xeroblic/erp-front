import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { WarehouseLabel } from '@/components/procurement';
import { formatDate, formatDateTime } from '@/utils/format.utils';
import type { IStockReceipt } from '@/interface/procurement.interface';
import StockReceiptStatusBadge from '../../../components/parts/StockReceiptStatusBadge';

interface IStockReceiptSummaryCardProps {
	receipt: IStockReceipt;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
	<div>
		<dt className='text-sm text-zinc-500 dark:text-zinc-400'>{label}</dt>
		<dd className='font-medium'>{children}</dd>
	</div>
);

/**
 * Encabezado de la ficha (sección 7): bodega, proveedor, documento vinculado
 * (o motivo, si no lo hay), fecha de recepción y estado. `posted_by` se
 * muestra tal como llega — nunca un worker anónimo.
 */
const StockReceiptSummaryCard: React.FC<IStockReceiptSummaryCardProps> = ({ receipt }) => (
	<Card>
		<CardHeader>
			<CardTitle className='text-lg'>Recepción #{receipt.id}</CardTitle>
			<StockReceiptStatusBadge status={receipt.status} />
		</CardHeader>
		<CardBody>
			<dl className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				<Field label='Bodega'>
					<WarehouseLabel warehouse={receipt.warehouse} />
				</Field>
				<Field label='Proveedor'>
					{receipt.supplier ? (
						<span>
							{receipt.supplier.display_name} ·{' '}
							<span className='font-mono'>{receipt.supplier.rut}</span>
						</span>
					) : (
						<span className='text-zinc-400'>Sin proveedor</span>
					)}
				</Field>
				<Field label='Documento vinculado'>
					{receipt.purchase_document ? (
						<span className='font-mono'>
							{receipt.purchase_document.document_number}
						</span>
					) : (
						<span className='text-zinc-400'>Sin documento</span>
					)}
				</Field>
				<Field label='Fecha de recepción'>{formatDate(receipt.received_on)}</Field>
				{receipt.reason && <Field label='Motivo'>{receipt.reason}</Field>}
				{receipt.notes && <Field label='Notas'>{receipt.notes}</Field>}
				{receipt.posted_at && (
					<Field label='Contabilizada'>
						{formatDateTime(receipt.posted_at)}
						{receipt.posted_by && ` · ${receipt.posted_by.name}`}
					</Field>
				)}
				{receipt.cancellation_reason && (
					<Field label='Motivo de anulación'>{receipt.cancellation_reason}</Field>
				)}
				{receipt.reversal_reason && (
					<Field label='Motivo de reversión'>{receipt.reversal_reason}</Field>
				)}
			</dl>
		</CardBody>
	</Card>
);

export default StockReceiptSummaryCard;
