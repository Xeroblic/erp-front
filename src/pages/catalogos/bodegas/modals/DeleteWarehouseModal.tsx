import React from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/icon/Icon';
import type { IWarehouse } from '@/interface/warehouse.interface';

interface DeleteWarehouseModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	warehouse: IWarehouse | null;
	onConfirm: () => Promise<boolean>;
	loading?: boolean;
}

const DeleteWarehouseModal: React.FC<DeleteWarehouseModalProps> = ({
	isOpen,
	setIsOpen,
	warehouse,
	onConfirm,
	loading = false,
}) => {
	const [isDeleting, setIsDeleting] = React.useState(false);

	const handleConfirm = async () => {
		setIsDeleting(true);
		const success = await onConfirm();
		setIsDeleting(false);
		if (success) {
			setIsOpen(false);
		}
	};

	if (!warehouse) return null;

	const hasProducts = warehouse.products && warehouse.products.length > 0;
	const productsCount = warehouse.products?.length || 0;

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='lg'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
						<Icon icon='HeroTrash' className='size-5 text-red-600 dark:text-red-400' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							Confirmar eliminación
						</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Esta acción no se puede deshacer
						</p>
					</div>
				</div>
			</ModalHeader>

			<ModalBody>
				{hasProducts ? (
					<Alert color='red' icon='HeroXCircle' title='No se puede eliminar'>
						<p className='mb-2'>
							No se puede eliminar la bodega porque tiene{' '}
							<strong>{productsCount}</strong> producto(s) asociados.
						</p>
						<p>
							Para eliminarla, primero debes quitar todos los productos de esta
							bodega.
						</p>
					</Alert>
				) : (
					<div className='space-y-4'>
						<Alert color='amber' icon='HeroExclamationTriangle' title='Advertencia'>
							¿Estás seguro de que deseas eliminar esta bodega?
						</Alert>

						<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50'>
							<dl className='space-y-2'>
								<div>
									<dt className='text-sm font-medium text-gray-500 dark:text-gray-400'>
										Nombre
									</dt>
									<dd className='text-sm font-semibold text-gray-900 dark:text-white'>
										{warehouse.name}
									</dd>
								</div>
								<div>
									<dt className='text-sm font-medium text-gray-500 dark:text-gray-400'>
										Código
									</dt>
									<dd className='text-sm font-semibold text-gray-900 dark:text-white'>
										{warehouse.code}
									</dd>
								</div>
								<div>
									<dt className='text-sm font-medium text-gray-500 dark:text-gray-400'>
										Tipo
									</dt>
									<dd className='text-sm text-gray-900 dark:text-white'>
										{warehouse.warehouse_type}
									</dd>
								</div>
							</dl>
						</div>

						<p className='text-sm text-gray-600 dark:text-gray-400'>
							Esta acción eliminará permanentemente la bodega y toda su información
							asociada.
						</p>
					</div>
				)}
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button
						color='zinc'
						variant='outline'
						className='bg-zinc-400/20'
						onClick={() => setIsOpen(false)}
						isDisable={isDeleting || loading}>
						Cancelar
					</Button>
					{!hasProducts && (
						<Button
							color='red'
							variant='outline'
							className='bg-red-400/20'
							onClick={handleConfirm}
							isLoading={isDeleting || loading}
							isDisable={isDeleting || loading}>
							Sí, eliminar bodega
						</Button>
					)}
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteWarehouseModal;
