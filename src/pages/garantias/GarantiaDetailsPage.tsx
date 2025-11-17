import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import WarrantyStatusBadge from './components/WarrantyStatusBadge';
import WarrantyFormModal from './components/WarrantyFormModal';
import DeleteWarrantyModal from './components/DeleteWarrantyModal';
import { useWarrantyDetails } from './hooks/useWarrantyDetails';
import { useWarrantyLookups } from './hooks/useWarrantyLookups';
import { toast } from '@/utils/toast.utils';
import { getUserSubsidiaryId } from './utils/subsidiary.utils';
import { deleteWarranty } from '@/store/slices/garantias/thunks';

const GarantiaDetailsPage: React.FC = () => {
	const { warrantyId } = useParams<{ warrantyId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);
	const subsidiaryId = getUserSubsidiaryId(user);
	const branchId = user?.branch?.id ?? null;
	const parsedWarrantyId = Number(warrantyId);

	const { detail, loading, reload } = useWarrantyDetails(subsidiaryId, parsedWarrantyId);
	const { productOptions, customerOptions, saleOptions, searchSales } = useWarrantyLookups(
		subsidiaryId,
		branchId,
	);

	const [formOpen, setFormOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const handleDelete = async () => {
		if (!subsidiaryId || !detail) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteWarranty({ subsidiaryId, warrantyId: detail.id })).unwrap();
			toast.success('Garantía eliminada');
			navigate('/garantias');
		} catch (error: unknown) {
			const message =
				(error as { response?: { data?: { message?: string } } })?.response?.data
					?.message || 'No se pudo eliminar la garantía';
			toast.error(message);
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<PageWrapper name='garantia-detail'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<h1 className='text-2xl font-semibold text-zinc-900'>
							Detalle de garantía
						</h1>
						<p className='text-sm text-zinc-500'>
							Consulta la información completa de la garantía.
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex flex-wrap gap-2'>
						<Button
							variant='outline'
							icon='HeroArrowLeft'
							onClick={() => navigate('/garantias')}>
							Volver
						</Button>
						<Button
							variant='outline'
							icon='HeroPencil'
							onClick={() => setFormOpen(true)}
							isDisable={!detail}>
							Editar
						</Button>
						<Button
							color='red'
							icon='HeroTrash'
							onClick={() => setDeleteOpen(true)}
							isDisable={!detail}>
							Eliminar
						</Button>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				{!subsidiaryId && (
					<Alert color='blue' variant='outline' className='mb-4'>
						Selecciona una empresa para acceder al detalle de la garantía.
					</Alert>
				)}

				{loading && (
					<Card>
						<CardBody className='flex items-center justify-center space-x-2 py-10 text-sm text-zinc-500'>
							<Icon
								icon='DuoLoading'
								className='h-5 w-5 animate-spin text-emerald-500'
							/>
							<span>Cargando información...</span>
						</CardBody>
					</Card>
				)}

				{!loading && detail && (
					<Card className='mb-6'>
						<CardBody className='space-y-6'>
							<div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
								<div>
									<h2 className='text-xl font-semibold text-zinc-900'>
										Garantía #{detail.id}
									</h2>
									<p className='text-sm text-zinc-500'>
										{detail.serial_number
											? `Serie ${detail.serial_number}`
											: 'Sin serie registrada'}
									</p>
								</div>
								<div className='flex items-center gap-3'>
									<div className='text-right'>
										<p className='text-xs uppercase text-zinc-400'>
											Días restantes
										</p>
										<p
											className={`text-base font-semibold ${
												detail.daysRemaining?.isExpired
													? 'text-red-600'
													: 'text-emerald-600'
											}`}>
											{detail.daysRemaining?.label ?? '—'}
										</p>
									</div>
									<WarrantyStatusBadge status={detail.status} />
								</div>
							</div>

							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div>
									<p className='text-xs uppercase text-zinc-400'>Producto</p>
									<p className='text-base font-semibold text-zinc-900'>
										{detail.product
											? `${detail.product.name ?? 'Producto'}${
													detail.product.sku
														? ` (${detail.product.sku})`
														: ''
												}`
											: 'Sin producto'}
									</p>
									<p className='text-sm text-zinc-500'>
										{detail.warrantyTypeLabel ?? '—'}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-400'>Período</p>
									<p className='text-base font-semibold text-zinc-900'>
										{detail.periodLabel ?? 'Sin fechas'}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-400'>Cliente</p>
									<p className='text-base font-semibold text-zinc-900'>
										{detail.customer?.name ?? 'Sin cliente'}
									</p>
									<p className='text-sm text-zinc-500'>
										{detail.customer?.rut ?? detail.customer?.email ?? ''}
									</p>
								</div>
								<div>
									<p className='text-xs uppercase text-zinc-400'>Venta</p>
									<p className='text-base font-semibold text-zinc-900'>
										{detail.sale?.sale_number ?? 'Sin venta'}
									</p>
								</div>
							</div>

							<div>
								<p className='text-xs uppercase text-zinc-400'>Notas</p>
								<p className='text-sm text-zinc-600'>
									{detail.notes?.trim() ? detail.notes : 'Sin notas registradas.'}
								</p>
							</div>
						</CardBody>
					</Card>
				)}

				{!loading && !detail && (
					<Alert color='amber' variant='outline'>
						No se encontró la información de la garantía solicitada.
					</Alert>
				)}
			</Container>

			{detail && formOpen && (
				<WarrantyFormModal
					isOpen={formOpen}
					onClose={() => setFormOpen(false)}
					onSuccess={reload}
					subsidiaryId={subsidiaryId}
					mode='edit'
					warranty={detail}
					productOptions={productOptions}
					customerOptions={customerOptions}
					saleOptions={saleOptions}
					onSearchSales={searchSales}
				/>
			)}

			{detail && (
				<DeleteWarrantyModal
					isOpen={deleteOpen}
					onClose={() => setDeleteOpen(false)}
					onConfirm={handleDelete}
					loading={deleteLoading}
					warranty={detail}
				/>
			)}
		</PageWrapper>
	);
};

export default GarantiaDetailsPage;
