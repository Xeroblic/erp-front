import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { cancelStockReceiptThunk } from '@/store/slices/procurement/stockReceiptsSlice';
import type { IStockReceipt } from '@/interface/procurement.interface';

/**
 * Anulación de `cancel` (sección 7): motivo obligatorio, sólo desde
 * `draft`/`failed`. Sin efecto físico.
 */

interface ICancelStockReceiptModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	receipt: Pick<IStockReceipt, 'id'> | null;
	subsidiaryId: number | null;
	onCancelled: () => void;
}

const CancelStockReceiptModal: React.FC<ICancelStockReceiptModalProps> = ({
	isOpen,
	setIsOpen,
	receipt,
	subsidiaryId,
	onCancelled,
}) => {
	const dispatch = useAppDispatch();
	const [reason, setReason] = useState('');
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo anular la recepción.',
	});

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		// Hallazgo 8: con un resultado incierto (`canRetry`), conserva el
		// motivo y la clave — reabrir debe seguir listo para reintentar
		// exactamente el mismo comando, no un motivo en blanco con la misma
		// `Idempotency-Key` (eso termina en `IDEMPOTENCY_KEY_REUSED`).
		if (!idempotentWrite.canRetry) {
			setReason('');
			idempotentWrite.clearError();
		}
	};

	const handleConfirm = async () => {
		if (!receipt || !reason.trim()) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				cancelStockReceiptThunk({
					subsidiaryId,
					id: receipt.id,
					payload: { reason: reason.trim() },
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(`Recepción #${receipt.id} anulada.`);
			handleClose();
			onCancelled();
		}
	};

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
					Anular recepción
				</h2>
			</ModalHeader>
			<ModalBody>
				<p className='text-lg'>
					¿Anular la recepción <strong>#{receipt?.id}</strong>?
				</p>
				<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
					No tuvo efecto físico: no hay stock que revertir.
				</p>
				<div className='mt-3 space-y-1'>
					<Label htmlFor='cancel-recepcion-reason'>Motivo</Label>
					<Textarea
						id='cancel-recepcion-reason'
						name='reason'
						rows={3}
						disabled={idempotentWrite.canRetry}
						value={reason}
						onChange={(event) => setReason(event.target.value)}
						isValid={reason.trim().length > 0}
						isTouched={reason.length > 0}
						invalidFeedback='Indica el motivo de anulación.'
					/>
				</div>
				{idempotentWrite.error && (
					<p role='alert' className='mt-3 text-sm text-red-600 dark:text-red-400'>
						{idempotentWrite.error.message}
					</p>
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
						isDisable={idempotentWrite.isSubmitting || !reason.trim()}
						isLoading={idempotentWrite.isSubmitting}>
						{idempotentWrite.canRetry ? 'Reintentar' : 'Anular'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CancelStockReceiptModal;
