import React, { useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { deleteSale } from '@/store/slices/sales/salesSlice';
import type { ISale } from '@/interface/sales.interface';

interface Props {
	isOpen: boolean;
	setIsOpen: (v: boolean) => void;
	sale: ISale | null;
	subsidiaryId: number | string;
	/** Se invoca tras un borrado exitoso (p. ej. para refrescar la lista). */
	onDeleted?: () => void;
}

const DeleteSaleModal: React.FC<Props> = ({
	isOpen,
	setIsOpen,
	sale,
	subsidiaryId,
	onDeleted,
}) => {
	const dispatch = useAppDispatch();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!sale || !subsidiaryId) return;
		setIsDeleting(true);
		try {
			await dispatch(
				deleteSale({ subsidiaryId: Number(subsidiaryId), id: sale.id }),
			).unwrap();
			setIsOpen(false);
			onDeleted?.();
		} catch {
			// El thunk ya notifica el error con un toast.
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => { if (!isDeleting) setIsOpen(false); }} size='sm' isCentered>
			<ModalHeader>Eliminar venta</ModalHeader>

			<ModalBody>
				<p className='text-lg'>
					¿Estás seguro que deseas eliminar la venta{' '}
					<span className='font-bold'>Nº {sale?.sale_number ?? ''}</span>?
				</p>
				<p className='mt-2 text-sm text-red-500'>Esta acción no se puede deshacer.</p>
			</ModalBody>

			<ModalFooter>
				<Button variant='outline' onClick={() => setIsOpen(false)} isDisable={isDeleting}>
					Cancelar
				</Button>
				<Button
					variant='outline'
					color='red'
					onClick={handleDelete}
					isDisable={isDeleting}>
					{isDeleting ? 'Eliminando…' : 'Eliminar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteSaleModal;
