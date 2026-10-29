import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaginationState } from '@tanstack/react-table';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../../components/layouts/Subheader/Subheader';
import Container from '../../../components/layouts/Container/Container';
import Icon from '../../../components/icon/Icon';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ICustomerSupplierFilters } from './components/types';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';
import { useClientes } from './components/hooks/useClientes';
import CustomersTable from './components/tables/CustomersTable';
import CrearCliente from './components/modals/CrearCliente';
// import EditarCliente from './components/modals/EditarCliente';
import EliminarCliente from './components/modals/EliminarCliente';
import { useAppDispatch } from '@/store';
import {
	createCustomerSupplier,
	updateCustomerSupplier,
	deleteCustomerSupplier,
} from '@/store/slices/customerSuppliers/customerSuppliersSlice';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

// Hooks centralizados de autorización
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useAuthorization from '@/hooks/useAuthorization';

const Clientes: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	// ── Autorización centralizada ─────────────────────────────────────────
	const { branchId: currentBranchId, subsidiaryId } = useCurrentBranch();
	const { canAccessBranch } = useAuthorization();

	// ── Estado local de UI ────────────────────────────────────────────────
	const [filters] = useState<ICustomerSupplierFilters>({ search: '' });
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 5,
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState<ICustomerSupplier | null>(null);

	const handlePaginationChange = useCallback(
		(updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
			setPagination(updater);
		},
		[],
	);

	// ── Hook de datos (reactivo al cambio de subsidiaryId) ────────────────
	const { customers, loading, activeSubsidiaryId, meta } = useClientes({
		subsidiaryId,
		filters,
		page: pagination.pageIndex + 1,
		per_page: pagination.pageSize,
	});

	// ── Handlers ──────────────────────────────────────────────────────────
	const onCreate = () => setCreateOpen(true);
	const onView = (c: ICustomerSupplier) => {
		navigate(`/catalogos/clientes/${c.id}`);
	};
	const onEdit = (c: ICustomerSupplier) => {
		setSelected(c);
		setEditOpen(true);
	};
	const onDelete = (c: ICustomerSupplier) => {
		setSelected(c);
		setDeleteOpen(true);
	};

	const handleCreateSubmit = async (values: { name: string; subsidiaryId: number }) => {
		await dispatch(
			createCustomerSupplier({
				subsidiaryId: values.subsidiaryId,
				data: { name: values.name },
			}),
		);
		setCreateOpen(false);
	};

	const handleEditSubmit = async (values: { name: string }) => {
		if (!selected || !activeSubsidiaryId) return;
		await dispatch(
			updateCustomerSupplier({
				subsidiaryId: activeSubsidiaryId,
				data: { id: selected.id, name: values.name },
			}),
		);
		setEditOpen(false);
		setSelected(null);
	};

	const handleConfirmDelete = async () => {
		if (!selected || !activeSubsidiaryId) return;
		await dispatch(
			deleteCustomerSupplier({ subsidiaryId: activeSubsidiaryId, id: selected.id }),
		);
		setDeleteOpen(false);
		setSelected(null);
	};

	// ── Verificación de acceso ────────────────────────────────────────────
	const hasBranchAccess = canAccessBranch(currentBranchId);

	return (
		<PageWrapper name='clientes-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
							<Icon
								icon='HeroUserGroup'
								className='h-6 w-6 text-blue-600 dark:text-blue-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Clientes-Proveedor
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de clientes y análisis comercial
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission={ERP_PERMISSIONS.CATALOGS.CUSTOMERS.CREATE}
						branchId={currentBranchId}
						scope='access'
						fallbackMode='hidden'
						color='blue'
						onClick={onCreate}
						icon='HeroPlus'>
						Nuevo Cliente
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>

			<Container>
				{!hasBranchAccess && currentBranchId && (
					<div className='mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300'>
						<Icon icon='HeroShieldExclamation' className='size-5 shrink-0' />
						<span>
							No tienes acceso de operación a la sucursal seleccionada. Los datos se
							muestran en modo lectura.
						</span>
					</div>
				)}

				{loading ? (
					<div className='py-10 text-center text-sm text-gray-500'>
						Cargando clientes...
					</div>
				) : (
					<CustomersTable
						customers={customers}
						onView={onView}
						onEdit={onEdit}
						onDelete={onDelete}
						loading={loading}
						meta={meta}
						pagination={pagination}
						onPaginationChange={handlePaginationChange}
					/>
				)}
			</Container>
			<CrearCliente
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
				defaultSubsidiaryId={subsidiaryId}
			/>
			{/* <EditarCliente
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				customer={selected}
				onSubmit={handleEditSubmit}
			/> */}
			<EliminarCliente
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				customer={selected}
				onConfirm={handleConfirmDelete}
			/>
		</PageWrapper>
	);
};

export default Clientes;
