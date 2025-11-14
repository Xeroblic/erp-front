import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface Product {
	id: number;
	name: string;
	sku: string;
	quantity: number;
}

interface RemoveProductModalProps {
	isOpen: boolean;
	product: Product | null;
	onClose: () => void;
	onConfirm: (productId: number) => Promise<void>;
}

const RemoveProductModal: React.FC<RemoveProductModalProps> = ({
	isOpen,
	product,
	onClose,
	onConfirm,
}) => {
	if (!product) return null;

	const handleConfirm = async () => {
		await onConfirm(product.id);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='md'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
						<Icon
							icon='HeroExclamationTriangle'
							className='text-red-600 dark:text-red-400'
						/>
					</div>
					<h3 className='text-lg font-semibold'>Confirmar eliminación</h3>
				</div>
			</ModalHeader>
			<ModalBody>
				<p className='text-sm'>¿Estás seguro de quitar este producto de la bodega?</p>
				<div className='mt-3 rounded-lg border p-3'>
					<p className='font-medium'>Producto: {product.name}</p>
					<p className='text-sm text-gray-600'>SKU: {product.sku}</p>
					<p className='text-sm text-gray-600'>Cantidad: {product.quantity}</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={onClose}>
						Cancelar
					</Button>
					<Button color='red' onClick={handleConfirm}>
						Sí, quitar
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default RemoveProductModal;
