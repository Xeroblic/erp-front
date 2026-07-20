import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Input from '@/components/form/Input';
import Icon from '@/components/icon/Icon';
import ProtectedButton from '@/components/ui/ProtectedButton';
import WarehousesTable from './tables/WarehousesTable';
import WarehouseStats from './components/WarehouseStats';
import { useBodegas } from './hooks/useBodegas';

const WarehousesCharts = React.lazy(() => import('./components/WarehousesCharts'));
const CreateWarehouseModal = React.lazy(() => import('./modals/CreateWarehouseModal'));
const EditWarehouseModal = React.lazy(() => import('./modals/EditWarehouseModal'));
const DeleteWarehouseModal = React.lazy(() => import('./modals/DeleteWarehouseModal'));

const BodegasView: React.FC = () => {
	const { state, forms, actions } = useBodegas();

	return (
		<PageWrapper isProtectedRoute title='Bodegas' name='bodegas'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<div className='flex items-center gap-2'>
							<Icon icon='HeroHomeModern' className='text-3xl' />
							<span className='text-2xl font-bold'>Bodegas</span>
						</div>
						<div className='flex flex-col gap-2'>
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								Administración de las bodegas asociadas a la sucursal principal.
							</p>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								{state.stats.total} bodega{state.stats.total !== 1 ? 's' : ''} registrada
								{state.stats.total !== 1 ? 's' : ''} • {state.stats.actives} activa
								{state.stats.actives !== 1 ? 's' : ''}
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-3'>
					<div className='relative'>
						<Input
							name='warehouse-search'
							placeholder='Buscar por nombre, código o tipo...'
							value={state.globalFilter}
							onChange={(e) => actions.setGlobalFilter(e.target.value)}
							className='w-64'
							dimension='lg'
						/>
						{state.globalFilter && (
							<button
								onClick={() => actions.setGlobalFilter('')}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
								<Icon icon='HeroXMark' className='size-5' />
							</button>
						)}
					</div>
					<ProtectedButton
						permission='create-warehouse'
						branchId={state.branchId}
						scope='access'
						variant='solid'
						color='blue'
						icon='HeroPlus'
						size='lg'
						onClick={actions.openCreateModal}>
						Nueva Bodega
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				{/* Estadísticas rápidas */}
				{!state.loading && state.warehouses.length > 0 && (
					<WarehouseStats
						total={state.stats.total}
						actives={state.stats.actives}
						withProducts={state.stats.with_products}
						nearCapacity={state.stats.near_capacity}
					/>
				)}

				{/* Charts de análisis */}
				{!state.loading && state.warehouses.length > 0 && (
					<React.Suspense
						fallback={
							<div className='h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800' />
						}>
						<WarehousesCharts warehouses={state.warehouses} />
					</React.Suspense>
				)}

				{/* Tabla de bodegas */}
				<WarehousesTable
					warehouses={state.warehouses}
					loading={state.loading}
					onEdit={actions.handleEdit}
					onDelete={actions.handleDelete}
					branchId={state.branchId}
				/>
			</Container>

			{/* Modales con Lazy Loading */}
			<React.Suspense
				fallback={
					<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
						<div className='h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent' />
					</div>
				}>
				{state.createModalOpen && (
					<CreateWarehouseModal
						isOpen={state.createModalOpen}
						setIsOpen={actions.setCreateModalOpen}
						form={forms.create}
						branchId={state.branchId}
					/>
				)}

				{state.editModalOpen && (
					<EditWarehouseModal
						isOpen={state.editModalOpen}
						setIsOpen={actions.setEditModalOpen}
						form={forms.edit}
						branchId={state.branchId}
					/>
				)}

				{state.deleteModalOpen && (
					<DeleteWarehouseModal
						isOpen={state.deleteModalOpen}
						setIsOpen={actions.setDeleteModalOpen}
						warehouse={state.selectedWarehouse}
						onConfirm={actions.confirmDelete}
					/>
				)}
			</React.Suspense>
		</PageWrapper>
	);
};

export default BodegasView;
