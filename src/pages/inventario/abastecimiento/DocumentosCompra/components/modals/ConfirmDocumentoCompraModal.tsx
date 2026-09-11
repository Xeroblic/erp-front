import React from 'react';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import useIdempotentWrite from '@/hooks/useIdempotentWrite';
import { useAppDispatch } from '@/store';
import { confirmPurchaseDocumentThunk } from '@/store/slices/procurement/purchaseDocumentsSlice';
import type { IPurchaseDocument } from '@/interface/procurement.interface';

/** Tarjeta de primer nivel dentro del cuerpo del modal (mismo estándar que el resto de abastecimiento). */
const CONFIRM_DOCUMENTO_CARD_CLASSNAME =
	'border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900';

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
			<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
				<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
					Confirmar documento
				</h2>
			</ModalHeader>
			<ModalBody>
				<Card className={CONFIRM_DOCUMENTO_CARD_CLASSNAME}>
					<CardBody>
						<p className='text-lg'>
							¿Confirmar el documento <strong>{document?.document_number}</strong>?
						</p>
						<p className='mt-2 text-sm text-zinc-500 dark:text-zinc-400'>
							El documento deja de editarse y queda disponible para recibir mercadería
							contra él.
						</p>
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
						onClick={() => setIsOpen(false)}
						isDisable={idempotentWrite.isSubmitting}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='emerald'
						onClick={handleConfirm}
						isDisable={idempotentWrite.isSubmitting}
						isLoading={idempotentWrite.isSubmitting}>
						Confirmar
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default ConfirmDocumentoCompraModal;
