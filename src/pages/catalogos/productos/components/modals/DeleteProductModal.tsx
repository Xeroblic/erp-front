import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { IProduct } from '@/interface/product.interface';

interface DeleteProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: IProduct | null;
	onConfirm: () => Promise<void>;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
	isOpen,
	onClose,
	product,
	onConfirm,
}) => {
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirm();
		} finally {
			setIsDeleting(false);
		}
	};
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600'>
						<Icon icon='HeroTrash' className='h-5 w-5' />
					</span>
					<div>
						<p className='text-lg font-semibold'>Eliminar producto</p>
						<p className='text-sm text-neutral-500'>Esta acción no se puede deshacer</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4 py-4'>
					{product && (
						<div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
							<p className='text-sm font-medium text-gray-900'>{product.name}</p>
							{product.sku && (
								<p className='text-sm text-gray-500'>SKU: {product.sku}</p>
							)}
						</div>
					)}
					<p className='text-sm text-neutral-600'>
						¿Estás seguro de que deseas eliminar este producto? Esta acción eliminará
						permanentemente el producto y toda su información asociada.
					</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex w-full justify-end gap-3'>
					<Button variant='outline' onClick={onClose} isDisable={isDeleting}>
						Cancelar
					</Button>
					<Button
						variant='solid'
						color='red'
						onClick={handleConfirm}
						isLoading={isDeleting}
						isDisable={isDeleting}>
						{isDeleting ? 'Eliminando...' : 'Eliminar producto'}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteProductModal;
