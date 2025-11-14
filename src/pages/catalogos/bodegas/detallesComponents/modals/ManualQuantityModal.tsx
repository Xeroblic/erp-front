import React, { useState, useEffect } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import { toast } from 'react-toastify';

interface ManualQuantityModalProps {
	isOpen: boolean;
	productId: number | null;
	initialQuantity: number;
	onClose: () => void;
	onConfirm: (productId: number, quantity: number) => Promise<void>;
}

const ManualQuantityModal: React.FC<ManualQuantityModalProps> = ({
	isOpen,
	productId,
	initialQuantity,
	onClose,
	onConfirm,
}) => {
	const [quantity, setQuantity] = useState(initialQuantity);

	// Update quantity when modal opens with new initial value
	useEffect(() => {
		if (isOpen) {
			setQuantity(initialQuantity);
		}
	}, [isOpen, initialQuantity]);

	const handleConfirm = async () => {
		if (!productId) {
			onClose();
			return;
		}

		const qty = Number(quantity) || 0;
		if (qty <= 0) {
			toast.error('La cantidad debe ser mayor a 0');
			return;
		}

		await onConfirm(productId, qty);
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='sm'>
			<ModalHeader>
				<h3 className='text-lg font-semibold'>Cantidad manual</h3>
			</ModalHeader>
			<ModalBody>
				<p className='text-sm'>Ingrese la cantidad manual para este producto</p>
				<Input
					name='cantidad_manual'
					type='number'
					min='1'
					value={quantity}
					onChange={(e) => setQuantity(parseInt(e.target.value || '0'))}
				/>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button color='blue' onClick={handleConfirm}>
						Confirmar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default ManualQuantityModal;
