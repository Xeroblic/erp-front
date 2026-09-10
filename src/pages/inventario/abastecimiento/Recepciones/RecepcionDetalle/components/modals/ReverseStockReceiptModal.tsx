import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { reverseStockReceiptThunk } from '@/store/slices/procurement/stockReceiptsSlice';
import type { IStockReceipt } from '@/interface/procurement.interface';

/**
 * Reversión de `reverse` (sección 7): motivo obligatorio, sólo desde
 * `posted`. Si las unidades ya se consumieron, el mock responde `409
 * RECEIPT_ALREADY_CONSUMED` — acá se muestra inline y se propone un ajuste
 * explícito, **nunca** «descontar otros productos iguales».
 */

interface IReverseStockReceiptModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	receipt: Pick<IStockReceipt, 'id'> | null;
	subsidiaryId: number | null;
	onReversed: () => void;
}

const ReverseStockReceiptModal: React.FC<IReverseStockReceiptModalProps> = ({
	isOpen,
	setIsOpen,
	receipt,
	subsidiaryId,
	onReversed,
}) => {
	const dispatch = useAppDispatch();
	const [reason, setReason] = useState('');
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo revertir la recepción.',
	});

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		// Hallazgo 8: con un resultado incierto (`canRetry`), conserva el
		// motivo y la clave para poder reabrir y reintentar exactamente el
		// mismo comando en vez de perderlo.
		if (!idempotentWrite.canRetry) {
			setReason('');
			idempotentWrite.clearError();
		}
	};

	const handleConfirm = async () => {
		if (!receipt || !reason.trim()) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				reverseStockReceiptThunk({
					subsidiaryId,
					id: receipt.id,
					payload: { reason: reason.trim() },
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(`Recepción #${receipt.id} revertida.`);
			handleClose();
			onReversed();
		}
	};

	const isAlreadyConsumed = idempotentWrite.error?.code === 'RECEIPT_ALREADY_CONSUMED';

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={(open) => {
				if (!open) handleClose();
			}}
			size='sm'
			isCentered
			isStaticBackdrop={idempotentWrite.isSubmitting}>
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Revertir recepción
				</h2>
			</ModalHeader>
			<ModalBody>
				<p className='text-lg'>
					¿Revertir la recepción <strong>#{receipt?.id}</strong>?
				</p>
				<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
					Compensa el ingreso conservando la historia. Si el documento tenía cobertura, se
					libera.
				</p>
				<div className='mt-3 space-y-1'>
					<Label htmlFor='reverse-recepcion-reason'>Motivo</Label>
					<Textarea
						id='reverse-recepcion-reason'
						name='reason'
						rows={3}
						disabled={idempotentWrite.canRetry}
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						isValid={reason.trim().length > 0}
						isTouched={reason.length > 0}
						invalidFeedback='Indica el motivo de la reversión.'
					/>
				</div>
				{idempotentWrite.error && !isAlreadyConsumed && (
					<p role='alert' className='mt-3 text-sm text-red-600 dark:text-red-400'>
						{idempotentWrite.error.message}
					</p>
				)}
				{isAlreadyConsumed && (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='Las unidades ya se consumieron'
						className='mt-3'>
						No se puede revertir esta recepción: parte del stock ya se usó. Corrige con
						un ajuste explícito de inventario en vez de forzar la reversión.
					</Alert>
				)}
			</ModalBody>
			<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
				<ModalFooterChild>
					<Button
						variant='outline'
						onClick={handleClose}
						isDisable={idempotentWrite.isSubmitting}>
						Volver
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='outline'
						color='red'
						onClick={handleConfirm}
						isDisable={
							idempotentWrite.isSubmitting || !reason.trim() || isAlreadyConsumed
						}
						isLoading={idempotentWrite.isSubmitting}>
						{idempotentWrite.canRetry ? 'Reintentar' : 'Revertir'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ReverseStockReceiptModal;
