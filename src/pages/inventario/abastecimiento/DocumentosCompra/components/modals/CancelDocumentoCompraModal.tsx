import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { cancelPurchaseDocumentThunk } from '@/store/slices/procurement/purchaseDocumentsSlice';
import type { IPurchaseDocument } from '@/interface/procurement.interface';

/** Tarjeta de primer nivel dentro del cuerpo del modal (mismo estándar que el resto de abastecimiento). */
const CANCEL_DOCUMENTO_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';

/**
 * Anulación de `cancel` (sección 6): motivo obligatorio, sólo sin
 * recepciones posted ni asignaciones activas — el mock lo valida y el 409
 * `PURCHASE_DOCUMENT_HAS_ACTIVE_RECEIPTS` se muestra inline. Libera el folio
 * para reutilizarlo.
 */

interface ICancelDocumentoCompraModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	document: Pick<IPurchaseDocument, 'id' | 'document_number'> | null;
	subsidiaryId: number | null;
	onCancelled: () => void;
}

const CancelDocumentoCompraModal: React.FC<ICancelDocumentoCompraModalProps> = ({
	isOpen,
	setIsOpen,
	document,
	subsidiaryId,
	onCancelled,
}) => {
	const dispatch = useAppDispatch();
	const [reason, setReason] = useState('');
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo anular el documento.',
	});

	const handleClose = () => {
		if (idempotentWrite.isSubmitting) return;
		setIsOpen(false);
		setReason('');
		idempotentWrite.clearError();
	};

	const handleConfirm = async () => {
		if (!document || !reason.trim()) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				cancelPurchaseDocumentThunk({
					subsidiaryId,
					id: document.id,
					payload: { reason: reason.trim() },
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(`Documento ${document.document_number} anulado.`);
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
					Anular documento
				</h2>
			</ModalHeader>
			<ModalBody>
				<Card className={CANCEL_DOCUMENTO_CARD_CLASSNAME}>
					<CardBody>
						<p className='text-lg'>
							¿Anular el documento <strong>{document?.document_number}</strong>?
						</p>
						<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
							Libera el folio para reutilizarlo. No tiene efecto sobre stock ya
							recibido.
						</p>
						<div className='mt-3 space-y-1'>
							<Label htmlFor='cancel-documento-reason'>Motivo</Label>
							<Textarea
								id='cancel-documento-reason'
								name='reason'
								rows={3}
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
					</CardBody>
				</Card>
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
						Anular
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CancelDocumentoCompraModal;
