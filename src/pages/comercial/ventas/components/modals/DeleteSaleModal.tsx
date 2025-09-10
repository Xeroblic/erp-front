/**
 * Modal de confirmación para eliminar venta
 * Proporciona confirmación visual antes de eliminar una venta
 */
import React from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { ISale } from '../../types/sales.types';

interface DeleteSaleModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (sale: ISale) => void;
	sale: ISale | null;
	loading?: boolean;
}

const DeleteSaleModal: React.FC<DeleteSaleModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	sale,
	loading = false,
}) => {
	if (!sale) return null;

	const handleConfirm = () => {
		onConfirm(sale);
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
		}).format(amount);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => onClose()} size='lg'>
			<ModalHeader className='flex items-center gap-3'>
				<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-100'>
					<Icon icon='HeroExclamationTriangle' className='h-5 w-5 text-red-600' />
				</div>
				<div>
					<h3 className='text-lg font-semibold text-gray-900'>Confirmar Eliminación</h3>
					<p className='text-sm text-gray-600'>Esta acción no se puede deshacer</p>
				</div>
			</ModalHeader>

			<ModalBody>
				<Card>
					<CardHeader>
						<CardTitle>Detalles de la Venta a Eliminar</CardTitle>
					</CardHeader>
					<CardBody>
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<p className='text-sm font-medium text-gray-600'>
										Número de Venta
									</p>
									<p className='text-lg font-semibold text-gray-900'>
										{sale.sale_number}
									</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>Cliente</p>
									<p className='text-lg font-semibold text-gray-900'>
										{sale.customer?.company_name ||
											`${sale.customer?.first_name || ''} ${sale.customer?.last_name || ''}`.trim() ||
											'Cliente no especificado'}
									</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>Total</p>
									<p className='text-lg font-semibold text-green-600'>
										{formatCurrency(sale.total_amount)}
									</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600'>Estado</p>
									<span
										className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
											sale.status === 'COMPLETED'
												? 'bg-green-100 text-green-800'
												: sale.status === 'PENDING'
													? 'bg-yellow-100 text-yellow-800'
													: 'bg-red-100 text-red-800'
										}`}>
										{sale.status === 'COMPLETED'
											? 'Completada'
											: sale.status === 'PENDING'
												? 'Pendiente'
												: 'Cancelada'}
									</span>
								</div>
							</div>

							<div className='rounded-lg bg-red-50 p-4'>
								<div className='flex items-start'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mt-0.5 h-5 w-5 text-red-400'
									/>
									<div className='ml-3'>
										<h4 className='text-sm font-medium text-red-800'>
											¿Está seguro que desea eliminar esta venta?
										</h4>
										<p className='mt-2 text-sm text-red-700'>
											Al eliminar esta venta se realizarán las siguientes
											acciones:
										</p>
										<ul className='mt-2 list-inside list-disc text-sm text-red-700'>
											<li>Se cancelará la venta permanentemente</li>
											<li>Se restaurará el inventario de los productos</li>
											<li>Se anularán los pagos registrados</li>
											<li>Esta acción no se puede deshacer</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</ModalBody>

			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' color='zinc' onClick={onClose} isDisable={loading}>
						Cancelar
					</Button>
					<Button color='red' onClick={handleConfirm} isDisable={loading}>
						{loading ? (
							<>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 animate-spin' />
								Eliminando...
							</>
						) : (
							<>
								<Icon icon='HeroTrash' className='mr-2 h-4 w-4' />
								Eliminar Venta
							</>
						)}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default DeleteSaleModal;
