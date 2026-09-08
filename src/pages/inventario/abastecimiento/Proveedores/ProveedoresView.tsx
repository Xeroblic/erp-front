import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { useAppDispatch } from '@/store';
import { restoreProcurementSupplierThunk } from '@/store/slices/procurement/procurementSuppliersSlice';
import type { IProcurementSupplierListRow } from '@/interface/procurement.interface';
import useProveedores from './hooks/useProveedores';
import ProveedoresFilters from './components/filters/ProveedoresFilters';
import ProveedoresTable from './components/tables/ProveedoresTable';
import ProveedorFormModal from './components/modals/ProveedorFormModal';
import DeactivateSupplierModal from './components/modals/DeactivateSupplierModal';

/**
 * Listado del maestro de proveedores (card 02, sección 5 del contrato de
 * abastecimiento).
 *
 * Esta pantalla trabaja con la fila resumida del listado, que a propósito no
 * trae `purchase_summary` ni `allowed_actions` (esos son caros y no van por
 * fila). Por eso «Editar» no vive acá: el formulario de edición necesita la
 * ficha completa, así que se ofrece desde `ProveedoresDetalle`, que ya la
 * tiene cargada. Acá sólo hay alta, ver, desactivar y restaurar.
 */
const ProveedoresView = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
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
	} = useProveedores();

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [deactivateTarget, setDeactivateTarget] = useState<IProcurementSupplierListRow | null>(
		null,
	);
	const [restoringId, setRestoringId] = useState<number | null>(null);

	const handleView = (id: number) => navigate(`/inventario/abastecimiento/proveedores/${id}`);

	const handleRestore = async (row: IProcurementSupplierListRow) => {
		setRestoringId(row.id);
		try {
			await dispatch(restoreProcurementSupplierThunk({ subsidiaryId, id: row.id })).unwrap();
			toast.success(`${row.display_name} fue restaurado.`);
			refresh();
		} catch {
			toast.error('No se pudo restaurar el proveedor.');
		} finally {
			setRestoringId(null);
		}
	};

	return (
		<PageWrapper isProtectedRoute title='Proveedores'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroBuildingStorefront' />
					<span>Inventario / Abastecimiento / Proveedores</span>
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
					loading={loading || restoringId !== null}
					hasError={Boolean(error)}
					hasSearch={hasSearch}
					onPaginationChange={onPaginationChange}
					onView={handleView}
					onDeactivate={setDeactivateTarget}
					onRestore={handleRestore}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
				/>
			</Container>

			<ProveedorFormModal
				isOpen={isCreateModalOpen}
				setIsOpen={setIsCreateModalOpen}
				subsidiaryId={subsidiaryId}
				supplier={null}
				onSuccess={() => refresh()}
				onViewSupplier={handleView}
			/>

			<DeactivateSupplierModal
				isOpen={deactivateTarget !== null}
				setIsOpen={(isOpen) => {
					if (!isOpen) setDeactivateTarget(null);
				}}
				supplier={deactivateTarget}
				subsidiaryId={subsidiaryId}
				onDeactivated={refresh}
			/>
		</PageWrapper>
	);
};

export default ProveedoresView;
