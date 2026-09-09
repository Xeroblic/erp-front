import React from 'react';
import Alert from '@/components/ui/Alert';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { formatDateTime } from '@/utils/format.utils';
import type { IStockReceipt } from '@/interface/procurement.interface';

interface IStockReceiptProcessingCardProps {
	receipt: IStockReceipt;
}

/**
 * Bloque `processing` (sección 7): visible en `queued` y `failed`. Es la
 * pieza más valiosa de la card — la UX asíncrona es justamente lo que el
 * contrato escrito no puede resolver solo.
 *
 * `queued`: nunca afirma que el stock ya está disponible. `failed`: muestra
 * `failure_message` (texto seguro en español), nunca una traza técnica.
 */
const StockReceiptProcessingCard: React.FC<IStockReceiptProcessingCardProps> = ({ receipt }) => {
	if (receipt.status !== 'queued' && receipt.status !== 'failed') return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>Publicación asíncrona</CardTitle>
			</CardHeader>
			<CardBody className='space-y-3'>
				{receipt.status === 'queued' && (
					<Alert color='blue' variant='outline' icon='HeroClock' title='Procesando'>
						<div className='flex items-center gap-2'>
							<Icon
								icon='HeroArrowPath'
								className='h-4 w-4 animate-spin'
								aria-hidden='true'
							/>
							<span>
								Publicando la recepción en segundo plano. El stock todavía{' '}
								<strong>no</strong> está disponible — esta pantalla se actualiza
								sola cuando termine.
							</span>
						</div>
					</Alert>
				)}
				{receipt.status === 'failed' && receipt.failure_message && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No se pudo publicar'>
						{receipt.failure_message}
					</Alert>
				)}

				<dl className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-3'>
					<div>
						<dt className='text-zinc-500 dark:text-zinc-400'>Intentos</dt>
						<dd className='font-medium'>{receipt.processing.attempt_count}</dd>
					</div>
					<div>
						<dt className='text-zinc-500 dark:text-zinc-400'>Último intento</dt>
						<dd className='font-medium'>
							{receipt.processing.last_attempt_at
								? formatDateTime(receipt.processing.last_attempt_at)
								: '—'}
						</dd>
					</div>
					<div>
						<dt className='text-zinc-500 dark:text-zinc-400'>Próximo reintento</dt>
						<dd className='font-medium'>
							{receipt.processing.next_retry_at
								? formatDateTime(receipt.processing.next_retry_at)
								: 'No programado'}
						</dd>
					</div>
				</dl>
			</CardBody>
		</Card>
	);
};

export default StockReceiptProcessingCard;
