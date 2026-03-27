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
	const isSerializedProduct = Boolean(product?.serial_tracking);

	const handleConfirm = async () => {
		if (!product || isSerializedProduct) {
			return;
		}
		setIsDeleting(true);
		try {
			await onConfirm();
		} finally {
			setIsDeleting(false);
		}
	};
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} isCentered>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-10 w-10 items-center justify-center rounded-full  bg-red-500/20 text-red-600'>
						<Icon icon='HeroTrash' className='h-5 w-5' />
					</span>
					<div className='mt-3'>
						<p className='text-lg font-semibold'>Eliminar producto</p>
						<p className='text-sm text-neutral-500'>Esta acción no se puede deshacer</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-4 py-4'>
					{product && (
						<div
							className={`rounded-lg border p-4 ${
								isSerializedProduct
									? 'border-amber-500 bg-amber-500/15'
									: 'border-dashed border-red-500 bg-red-500/20'
							}`}>
							<p className='text-sm font-bold text-white'>{product.name}</p>
							{product.sku && (
								<p className='text-sm text-gray-500'>SKU: {product.sku}</p>
							)}
							{isSerializedProduct && (
								<div className='mt-3 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-amber-100'>
									<Icon icon='HeroExclamationTriangle' className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300' />
									<div>
										<p className='text-sm font-semibold text-amber-200'>
											Producto no eliminable
										</p>
										<p className='text-sm text-amber-100/90'>
											Este producto no se puede eliminar porque está serializado y tiene revisiones asociadas.
										</p>
									</div>
								</div>
							)}
						</div>
					)}
					<p className='text-sm text-neutral-400'>
						{isSerializedProduct
							? 'Los productos serializados deben conservarse para mantener la trazabilidad de sus revisiones y movimientos.'
							: '¿Estás seguro de que deseas eliminar este producto? Esta acción eliminará permanentemente el producto y toda su información asociada.'}
					</p>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex w-full justify-end gap-3'>
					<Button variant='outline' onClick={onClose} isDisable={isDeleting}>
						{isSerializedProduct ? 'Cerrar' : 'Cancelar'}
					</Button>
					{!isSerializedProduct && (
						<Button
							variant='solid'
							color='red'
							onClick={handleConfirm}
							isLoading={isDeleting}
							isDisable={isDeleting}>
							{isDeleting ? 'Eliminando...' : 'Eliminar producto'}
						</Button>
					)}
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteProductModal;
