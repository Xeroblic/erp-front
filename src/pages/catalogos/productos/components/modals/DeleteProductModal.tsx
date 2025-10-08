import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { IProduct } from '@/interface/product.interface';

interface DeleteProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	product: IProduct | null;
	onConfirm: () => void;
	isProcessing?: boolean;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
	isOpen,
	onClose,
	product,
	onConfirm,
	isProcessing = false,
}) => {
	const handleCancel = () => {
		if (isProcessing) return;
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleCancel}>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500'>
						<Icon icon='HeroTrash' className='h-5 w-5' />
					</span>
					<div>
						<p className='text-lg font-semibold'>Eliminar producto</p>
						<p className='text-sm text-neutral-500'>Esta accion no se puede deshacer.</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				{product ? (
					<div className='space-y-4 text-sm'>
						<p>
							Estas seguro de que deseas eliminar el producto{' '}
							<strong>{product.name}</strong>?
						</p>
						<div className='flex flex-wrap items-center gap-2'>
							<Badge variant='outline'>SKU: {product.sku}</Badge>
							{product.brand?.name && <Badge variant='outline'>Marca: {product.brand.name}</Badge>}
						</div>
						<div className='rounded-lg border border-red-200 bg-red-50 p-3 text-red-700'>
							<div className='flex items-start gap-2'>
								<Icon icon='HeroExclamationTriangle' className='mt-0.5 h-5 w-5' />
								<div>
									<p className='text-sm font-medium'>Confirma la eliminacion</p>
									<p className='text-xs'>
										El producto se eliminara definitivamente y no podras recuperarlo.
									</p>
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className='py-6 text-center text-sm text-neutral-500'>
						Selecciona un producto para eliminar.
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<div className='flex w-full justify-end gap-3'>
					<Button variant='outline' onClick={handleCancel} isDisable={isProcessing}>
						Cancelar
					</Button>
					<Button color='red' onClick={onConfirm} isDisable={!product || isProcessing} isLoading={isProcessing}>
						Eliminar producto
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteProductModal;

