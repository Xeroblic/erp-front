import React, { Dispatch, SetStateAction } from 'react';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';

type EliminarClienteProps = {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	customer: ICustomerSupplier | null;
	onConfirm: () => void;
};

const EliminarCliente: React.FC<EliminarClienteProps> = ({
	isOpen,
	setIsOpen,
	customer,
	onConfirm,
}) => {
	const hasAssociations = Boolean(customer && (customer.suppliers_count ?? 0) > 0);

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='sm'>
			<ModalHeader>
				<div className='flex items-center space-x-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
						<Icon icon='HeroTrash' className='h-6 w-6 text-red-600' />
					</div>
					<h3 className='text-lg font-semibold text-red-600'>Confirmar Eliminación</h3>
				</div>
			</ModalHeader>
			<ModalBody>
				{customer ? (
					<div className='space-y-4 text-sm'>
						<p className='text-gray-700 dark:text-gray-300'>
							¿Estás seguro de que deseas eliminar el cliente{' '}
							<strong>{customer.name}</strong>?
						</p>
						<div className='flex items-center space-x-2 text-gray-600'>
							<span>ID:</span>
							<Badge variant='outline'>#{customer.id}</Badge>
						</div>
						{hasAssociations ? (
							<div className='rounded-md border border-red-200 bg-red-50 p-3 text-red-700'>
								<div className='flex items-start'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mr-2 mt-0.5 h-5 w-5 text-red-400'
									/>
									<div>
										<h4 className='text-sm font-medium text-red-800'>
											No se puede eliminar
										</h4>
										<p>
											Este cliente tiene {customer.suppliers_count}{' '}
											proveedor(es) asociado(s). Debes desasociar estos
											proveedores antes de continuar.
										</p>
									</div>
								</div>
							</div>
						) : (
							<div className='rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-700'>
								<div className='flex items-start'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mr-2 mt-0.5 h-5 w-5 text-yellow-400'
									/>
									<div>
										<h4 className='text-sm font-medium text-yellow-800'>
											Acción irreversible
										</h4>
										<p>
											Esta acción no se puede deshacer. El cliente será
											eliminado permanentemente.
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className='py-6 text-center text-sm text-gray-500'>
						Selecciona un cliente para eliminar.
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<div className='flex justify-end space-x-3'>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button
						color='red'
						onClick={onConfirm}
						isDisable={!customer || hasAssociations}>
						Eliminar Cliente
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default EliminarCliente;
