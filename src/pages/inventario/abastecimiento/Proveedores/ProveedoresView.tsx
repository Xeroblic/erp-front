import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import SubheaderTitle from '@/components/layouts/Subheader/SubheaderTitle';
import ProtectedButton from '@/components/ui/ProtectedButton';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';
import useProveedores from './hooks/useProveedores';
import useSupplierRestore from './hooks/useSupplierRestore';
import ProveedoresFilters from './components/filters/ProveedoresFilters';
import ProveedoresTable from './components/tables/ProveedoresTable';
import SupplierFormModal from './components/modals/SupplierFormModal';
import DeactivateSupplierModal from './components/modals/DeactivateSupplierModal';

/**
 * La fila del listado no trae `purchase_summary` ni `allowed_actions`, así que
 * «Editar» se ofrece desde `ProveedoresDetalle`, que ya tiene la ficha
 * completa. Acá sólo hay alta, ver, desactivar y restaurar.
 */
const ProveedoresView = () => {
	const navigate = useNavigate();
	const {
		branchId,
		subsidiaryId,
		items,
		meta,
		loading,
		error,
		search,
		status,
		statusOptions,
		hasSearch,
		setSearchValue,
		clearSearch,
		setStatusValue,
		onPaginationChange,
		refresh,
		refreshAfterMutation,
		deactivateTarget,
		openDeactivate,
		closeDeactivate,
	} = useProveedores();

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const handleView = (id: number) => navigate(`/inventario/abastecimiento/proveedores/${id}`);

	const { restore, isRestoring } = useSupplierRestore({
		subsidiaryId,
		onSuccess: () => {
			void refreshAfterMutation();
		},
	});
	const handleRestore = (row: IProcurementSupplierListRow) => restore(row.id);

	return (
		<PageWrapper isProtectedRoute title='Proveedores'>
			<Subheader>
				<SubheaderLeft>
					<SubheaderTitle
						icon='HeroBuildingStorefront'
						title='Proveedores'
						description='Maestro de proveedores de la filial: alta, consulta, desactivación y restauración'
					/>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission='create-procurement-supplier'
						branchId={branchId}
						subsidiaryId={subsidiaryId}
						scope='access'
						variant='solid'
						color='blue'
						icon='HeroPlus'
						onClick={() => setIsCreateModalOpen(true)}>
						Nuevo proveedor
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>
				<ProveedoresFilters
					search={search}
					onSearchChange={setSearchValue}
					onClearSearch={clearSearch}
					status={status}
					statusOptions={statusOptions}
					onStatusChange={setStatusValue}
				/>
				{error && (
					<Alert
						color='red'
						variant='outline'
						icon='HeroExclamationTriangle'
						title='No pudimos cargar los proveedores'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<span>{error}</span>
							<Button size='sm' variant='outline' onClick={refresh}>
								Reintentar
							</Button>
						</div>
					</Alert>
				)}
				<ProveedoresTable
					rows={items}
					meta={meta}
					loading={loading || isRestoring}
					hasError={Boolean(error)}
					hasSearch={hasSearch}
					onPaginationChange={onPaginationChange}
					onView={handleView}
					onDeactivate={openDeactivate}
					onRestore={handleRestore}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
				/>
			</Container>

			<SupplierFormModal
				isOpen={isCreateModalOpen}
				setIsOpen={setIsCreateModalOpen}
				branchId={branchId}
				subsidiaryId={subsidiaryId}
				supplier={null}
				onSuccess={() => refresh()}
				onViewSupplier={handleView}
			/>

			<DeactivateSupplierModal
				isOpen={deactivateTarget !== null}
				setIsOpen={(isOpen) => {
					if (!isOpen) closeDeactivate();
				}}
				supplier={deactivateTarget}
				subsidiaryId={subsidiaryId}
				onDeactivated={refreshAfterMutation}
			/>
		</PageWrapper>
	);
};

export default ProveedoresView;
