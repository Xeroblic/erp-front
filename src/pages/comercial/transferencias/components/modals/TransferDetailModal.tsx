import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table, { TBody, Td, Th, THead, Tr } from '@/components/ui/Table';
import Icon from '@/components/icon/Icon';
import type { ITransfer, ITransferItem, TransferStatus } from '@/interface/transfers.interface';
import { useAppDispatch } from '@/store';
import { fetchTransferById } from '@/store/slices/transfers/transfersSlice';

interface TransferDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	transfer: ITransfer | null;
}

const statusMap: Record<TransferStatus, string> = {
	pending: 'Pendiente',
	sent: 'Enviada',
	received: 'Recibida',
	completed: 'Completada',
	cancelled: 'Cancelada',
	draft: 'Borrador',
};

const TransferDetailModal: React.FC<TransferDetailModalProps> = ({ isOpen, onClose, transfer }) => {
	const dispatch = useAppDispatch();
	const [detail, setDetail] = useState<ITransfer | null>(transfer);
	const [loadingDetail, setLoadingDetail] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		const resolveDetail = async () => {
			if (!transfer?.id || !isOpen) {
				setDetail(transfer);
				setLoadingDetail(false);
				return;
			}

			// If we already have items we don't need to refetch.
			if (transfer.items && transfer.items.length > 0) {
				setDetail(transfer);
				setLoadingDetail(false);
				return;
			}

			try {
				setLoadingDetail(true);
				setError(null);
				const result = await dispatch(fetchTransferById(transfer.id)).unwrap();
				if (active) {
					setDetail(result);
				}
			} catch (fetchError: any) {
				if (active) {
					setError(
						fetchError?.message || 'No se pudo cargar el detalle de la transferencia',
					);
					// fall back to the original transfer to show at least basic info
					setDetail(transfer);
				}
			} finally {
				if (active) {
					setLoadingDetail(false);
				}
			}
		};

		resolveDetail();

		return () => {
			active = false;
		};
	}, [dispatch, transfer, isOpen]);

	if (!transfer || !detail) return null;

	const totals = detail.totals || {
		items: detail.items?.length || 0,
		quantity: detail.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
	};

	const resolveProductName = (item: ITransferItem) =>
		item.product?.name ||
		item.origin_product?.name ||
		item.destination_product?.name ||
		item.product_name ||
		`#${item.product_id}`;

	const resolveProductSku = (item: ITransferItem) =>
		item.product?.sku ||
		item.origin_product?.sku ||
		item.destination_product?.sku ||
		item.product_sku ||
		'—';

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div className='flex w-full items-center justify-between'>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							Detalles de la transferencia {detail.transfer_number || `#${detail.id}`}
						</h3>
						<p className='text-sm text-gray-500'>
							Creada el {new Date(detail.created_at).toLocaleString('es-CL')}
						</p>
					</div>
					<Badge color='blue'>{statusMap[detail.status] ?? detail.status}</Badge>
				</div>
			</ModalHeader>
			<ModalBody className='space-y-4'>
				{loadingDetail && (
					<p className='text-sm text-gray-500'>Cargando detalle de la transferencia...</p>
				)}
				{error && (
					<p className='rounded-md bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>
				)}
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<Card>
						<CardHeader>
							<CardTitle>Origen</CardTitle>
						</CardHeader>
						<CardBody className='space-y-2 text-sm'>
							<p className='flex items-center space-x-2'>
								<Icon
									icon='HeroBuildingStorefront'
									className='h-4 w-4 text-green-500'
								/>
								<span>{detail.from_branch?.name || 'Sucursal no definida'}</span>
							</p>
							<p className='flex items-center space-x-2'>
								<Icon icon='HeroArchiveBox' className='h-4 w-4 text-gray-500' />
								<span>{detail.from_warehouse?.name || 'Bodega no definida'}</span>
							</p>
						</CardBody>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Destino</CardTitle>
						</CardHeader>
						<CardBody className='space-y-2 text-sm'>
							<p className='flex items-center space-x-2'>
								<Icon icon='HeroBuildingOffice' className='h-4 w-4 text-blue-500' />
								<span>{detail.to_branch?.name || 'Sucursal no definida'}</span>
							</p>
							<p className='flex items-center space-x-2'>
								<Icon icon='HeroArchiveBox' className='h-4 w-4 text-gray-500' />
								<span>{detail.to_warehouse?.name || 'Bodega no definida'}</span>
							</p>
						</CardBody>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Resumen</CardTitle>
					</CardHeader>
					<CardBody className='grid grid-cols-1 gap-3 md:grid-cols-3'>
						<div>
							<p className='text-xs uppercase text-gray-500'>Total de productos</p>
							<p className='text-2xl font-semibold'>{totals.items}</p>
						</div>
						<div>
							<p className='text-xs uppercase text-gray-500'>Unidades transferidas</p>
							<p className='text-2xl font-semibold'>{totals.quantity}</p>
						</div>
						<div>
							<p className='text-xs uppercase text-gray-500'>Responsable</p>
							<p className='text-base font-medium'>
								{detail.responsible?.name || 'Sin asignar'}
							</p>
						</div>
					</CardBody>
				</Card>

				{detail.notes && (
					<Card>
						<CardHeader>
							<CardTitle>Notas</CardTitle>
						</CardHeader>
						<CardBody>
							<p className='text-sm text-gray-700'>{detail.notes}</p>
						</CardBody>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Productos</CardTitle>
					</CardHeader>
					<CardBody className='px-0'>
						<Table>
							<THead>
								<Tr>
									<Th>Producto</Th>
									<Th>SKU</Th>
									<Th>Cantidad</Th>
									<Th>Recibido</Th>
								</Tr>
							</THead>
							<TBody>
								{detail.items?.length ? (
									detail.items.map((item) => (
										<Tr key={item.id}>
											<Td>{resolveProductName(item)}</Td>
											<Td>{resolveProductSku(item)}</Td>
											<Td>{item.quantity}</Td>
											<Td>{item.received_quantity ?? 0}</Td>
										</Tr>
									))
								) : (
									<Tr>
										<Td
											colSpan={4}
											className='py-6 text-center text-sm text-gray-500'>
											No hay productos asociados en esta vista.
										</Td>
									</Tr>
								)}
							</TBody>
						</Table>
					</CardBody>
				</Card>
			</ModalBody>
		</Modal>
	);
};

export default TransferDetailModal;
