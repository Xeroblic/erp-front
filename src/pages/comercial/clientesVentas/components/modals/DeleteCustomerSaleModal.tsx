import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { deleteCustomerThunk } from '@/store/slices/customerSales/customerSalesSlice';

interface Props {
	isOpen: boolean;
	setIsOpen: (v: boolean) => void;
	customerId: number | string | null;
	subsidiaryId: number | string;
	onDeleted?: () => void;
}

const DeleteCustomerSaleModal: React.FC<Props> = ({
	isOpen,
	setIsOpen,
	customerId,
	subsidiaryId,
	onDeleted,
}) => {
	const dispatch = useAppDispatch();
	const [isDeleting, setIsDeleting] = useState(false);
	const isMountedRef = useRef(true);

	useEffect(
		() => () => {
			isMountedRef.current = false;
		},
		[],
	);

	const handleDelete = async () => {
		if (!customerId) return;
		setIsDeleting(true);
		try {
			await dispatch(
				deleteCustomerThunk({
					subsidiary: subsidiaryId,
					id: customerId,
				}),
			).unwrap();
			if (!isMountedRef.current) return;
			setIsOpen(false);
			onDeleted?.();
		} catch (error: unknown) {
			if (!isMountedRef.current) return;
			toast.error(typeof error === 'string' ? error : 'No se pudo eliminar el cliente');
		} finally {
			if (isMountedRef.current) setIsDeleting(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={() => {
				if (!isDeleting) setIsOpen(false);
			}}
			size='sm'
			isCentered
			isStaticBackdrop={isDeleting}>
			<ModalHeader>Eliminar Cliente</ModalHeader>

			<ModalBody>
				<p className='text-lg'>¿Estás seguro que deseas eliminar este cliente de ventas?</p>
				<p className='mt-2 text-sm text-red-500'>Esta acción no se puede deshacer.</p>
			</ModalBody>

			<ModalFooter>
				<Button variant='outline' onClick={() => setIsOpen(false)} isDisable={isDeleting}>
					Cancelar
				</Button>
				<Button variant='outline' color='red' onClick={handleDelete} isDisable={isDeleting}>
					{isDeleting ? 'Eliminando...' : 'Eliminar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteCustomerSaleModal;
