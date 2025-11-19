import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { deleteCustomerThunk } from '@/store/slices/customerSales/customerSalesSlice';

interface Props {
	isOpen: boolean;
	setIsOpen: (v: boolean) => void;
	customerId: number | string | null;
	subsidiaryId: number | string;
}

const DeleteCustomerSaleModal: React.FC<Props> = ({
	isOpen,
	setIsOpen,
	customerId,
	subsidiaryId,
}) => {
	const dispatch = useAppDispatch();

	const handleDelete = async () => {
		if (!customerId) return;

		await dispatch(
			deleteCustomerThunk({
				subsidiary: subsidiaryId,
				id: customerId,
			})
		);

		setIsOpen(false);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='sm' isCentered>
			<ModalHeader>Eliminar Cliente</ModalHeader>

			<ModalBody>
				<p className='text-lg'>
					¿Estás seguro que deseas eliminar este cliente de ventas?
				</p>
				<p className='text-sm text-red-500 mt-2'>
					Esta acción no se puede deshacer.
				</p>
			</ModalBody>

			<ModalFooter>
				<Button variant='outline' onClick={() => setIsOpen(false)}>
					Cancelar
				</Button>
				<Button variant='outline' color='red' onClick={handleDelete}>
					Eliminar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteCustomerSaleModal;
