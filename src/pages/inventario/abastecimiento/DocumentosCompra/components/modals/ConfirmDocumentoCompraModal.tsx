import React from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { confirmPurchaseDocumentThunk } from '@/store/slices/procurement/purchaseDocumentsSlice';
import type { IPurchaseDocument } from '@/interface/procurement.interface';

/**
 * Confirmación de `confirm` (sección 6): fija el snapshot de proveedor y
 * pasa el documento a `confirmed` — irreversible desde acá, así que pide
 * confirmación. El 422 de factura sin proveedor o incompleta se muestra
 * inline, no sólo por toast: es la validación más probable de encontrar acá.
 */

interface IConfirmDocumentoCompraModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	document: Pick<IPurchaseDocument, 'id' | 'document_number' | 'document_type'> | null;
	subsidiaryId: number | null;
	onConfirmed: () => void;
}

const ConfirmDocumentoCompraModal: React.FC<IConfirmDocumentoCompraModalProps> = ({
	isOpen,
	setIsOpen,
	document,
	subsidiaryId,
	onConfirmed,
}) => {
	const dispatch = useAppDispatch();
	const idempotentWrite = useIdempotentWrite({
		fallbackMessage: 'No se pudo confirmar el documento.',
	});

	const handleConfirm = async () => {
		if (!document) return;
		const result = await idempotentWrite.submit((headers) =>
			dispatch(
				confirmPurchaseDocumentThunk({
					subsidiaryId,
					id: document.id,
					headers: { idempotencyKey: headers['Idempotency-Key'] },
				}),
			).unwrap(),
		);

		if (result) {
			toast.success(`Documento ${document.document_number} confirmado.`);
			setIsOpen(false);
			onConfirmed();
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={() => {
				if (!idempotentWrite.isSubmitting) setIsOpen(false);
			}}
			size='sm'
			isCentered
			isStaticBackdrop={idempotentWrite.isSubmitting}>
			<ModalHeader>Confirmar documento</ModalHeader>
			<ModalBody>
				<p className='text-lg'>
					¿Confirmar el documento <strong>{document?.document_number}</strong>?
				</p>
				<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
					El documento deja de editarse y queda disponible para recibir mercadería contra
					él.
				</p>
				{idempotentWrite.error && (
					<p role='alert' className='mt-3 text-sm text-red-600 dark:text-red-400'>
						{idempotentWrite.error.message}
					</p>
				)}
			</ModalBody>
			<ModalFooter>
				<Button
					variant='outline'
					onClick={() => setIsOpen(false)}
					isDisable={idempotentWrite.isSubmitting}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					color='emerald'
					onClick={handleConfirm}
					isDisable={idempotentWrite.isSubmitting}
					isLoading={idempotentWrite.isSubmitting}>
					Confirmar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ConfirmDocumentoCompraModal;
