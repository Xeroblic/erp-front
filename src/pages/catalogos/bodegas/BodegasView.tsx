import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Badge from '@/components/ui/Badge';
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
			<Subheader className='p-2'>
				<SubheaderLeft>
					<div className='start-0'>
						<Badge className='text-3xl font-semibold'>Bodegas</Badge>
						<p>
							Administración de las bodegas asociadas a la sucursal principal.
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight className='flex space-x-2'>
					<ProtectedButton
						variant='outline'
						className='bg-emerald-400/30'
						permission='create-warehouse'
						branchId={state.branchId}
						scope='access'
						icon='HeroPlus'
						color='emerald'
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
					searchValue={state.globalFilter}
					onSearchChange={actions.setGlobalFilter}
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
						loading={state.deleting}
					/>
				)}
			</React.Suspense>
		</PageWrapper>
	);
};

export default BodegasView;
