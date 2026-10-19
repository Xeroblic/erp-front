import React from 'react';
import { ModalFooter, ModalFooterChild } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface IPurchaseDocumentFormFooterProps {
	isEdit: boolean;
	isSubmitting: boolean;
	/** Versión obsoleta o sin `ETag`: no se puede guardar. */
	isSaveBlocked: boolean;
	onCancel: () => void;
}

/** Cancelar y guardar. El guardado es el `submit` del `<form>` del modal. */
const PurchaseDocumentFormFooter: React.FC<IPurchaseDocumentFormFooterProps> = ({
	isEdit,
	isSubmitting,
	isSaveBlocked,
	onCancel,
}) => (
	<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-700 dark:bg-zinc-950'>
		<ModalFooterChild>
			<Button variant='outline' onClick={onCancel} isDisable={isSubmitting}>
				Cancelar
			</Button>
		</ModalFooterChild>
		<ModalFooterChild>
			<Button
				type='submit'
				variant='solid'
				color='blue'
				icon='HeroCheck'
				isDisable={isSubmitting || isSaveBlocked}
				isLoading={isSubmitting}>
				{isEdit ? 'Guardar cambios' : 'Crear documento'}
			</Button>
		</ModalFooterChild>
	</ModalFooter>
);

export default PurchaseDocumentFormFooter;
