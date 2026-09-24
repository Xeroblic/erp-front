import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import Container from '@/components/layouts/Container/Container';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import WarehousesTable from './tables/WarehousesTable';
import ResumenBodegas from './components/ResumenBodegas';
import BodegasFiltros from './components/BodegasFiltros';
import { useBodegas } from './hooks/useBodegas';

const CreateWarehouseModal = React.lazy(() => import('./modals/CreateWarehouseModal'));
const EditWarehouseModal = React.lazy(() => import('./modals/EditWarehouseModal'));
const DeleteWarehouseModal = React.lazy(() => import('./modals/DeleteWarehouseModal'));

const BodegasView: React.FC = () => {
	const { state, forms, actions } = useBodegas();

	return (
		<PageWrapper isProtectedRoute title='Bodegas'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='DuoBarcode'
						title='Bodegas'
						description='Bodegas de la sucursal activa: stock, capacidad y encargados'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission='create-warehouse'
						branchId={state.branchId}
						scope='access'
						variant='solid'
						color='blue'
						icon='HeroPlus'
						onClick={actions.openCreateModal}>
						Nueva bodega
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>

			<Container className='space-y-4'>
				<ResumenBodegas summary={state.summary} loading={state.loading} />
				{state.error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar las bodegas'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{state.error}</span>
							<Button size='sm' variant='outline' onClick={actions.refresh}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				<BodegasFiltros
					search={state.globalFilter}
					type={state.typeFilter}
					typeOptions={state.typeOptions}
					status={state.statusFilter}
					onSearch={actions.setGlobalFilter}
					onType={actions.setTypeFilter}
					onStatus={actions.setStatusFilter}
					onClear={actions.clearFilters}
				/>
				<WarehousesTable
					warehouses={state.warehouses}
					loading={state.loading}
					hasError={Boolean(state.error)}
					hasFilters={state.hasFilters}
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
						loading={state.deleting}
					/>
				)}
			</React.Suspense>
		</PageWrapper>
	);
};

export default BodegasView;
