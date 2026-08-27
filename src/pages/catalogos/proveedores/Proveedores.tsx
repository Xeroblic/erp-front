import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ISupplierFilters } from './components/types';
import type { ISupplier } from '@/interface/supplier.interface';
import { useProveedores } from './components/hooks/useProveedores';
import SupplierStats from './components/SupplierStats';
import SuppliersFilters from './components/SuppliersFilters';
import SuppliersTable from './components/tables/SuppliersTable';
import CrearProveedor from './components/modals/CrearProveedor';
// import EditarProveedor from './components/modals/EditarProveedor';
import EliminarProveedor from './components/modals/EliminarProveedor';
import { useAppDispatch } from '@/store';
import {
	createSupplier,
	updateSupplier,
	deleteSupplier,
} from '@/store/slices/suppliers/suppliersSlice';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

// Hooks centralizados de autorización
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useAuthorization from '@/hooks/useAuthorization';

const Proveedores: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	// ── Autorización centralizada ─────────────────────────────────────────
	const { branchId: currentBranchId, subsidiaryId } = useCurrentBranch();
	const { canAccessBranch } = useAuthorization();

	// ── Estado local de UI ────────────────────────────────────────────────
	const [filters, setFilters] = useState<ISupplierFilters>({
		search: '',
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState<ISupplier | null>(null);

	// ── Hook de datos (reactivo al cambio de subsidiaryId) ────────────────
	const { suppliers, stats, loading, activeSubsidiaryId } = useProveedores({
		subsidiaryId,
		filters,
	});

	// ── Handlers ──────────────────────────────────────────────────────────
	const handleFilterChange = useCallback((key: keyof ISupplierFilters, value: unknown) => {
		setFilters((prev) => ({
			...prev,
			[key]: value as ISupplierFilters[keyof ISupplierFilters],
		}));
	}, []);

	const handleClearFilters = () => {
		setFilters({
			search: '',
		});
	};

	const handleCreateSubmit = async (values: { name: string; subsidiaryId: number }) => {
		await dispatch(
			createSupplier({ subsidiaryId: values.subsidiaryId, data: { name: values.name } }),
		);
		setCreateOpen(false);
	};

	// const handleEditSubmit = async (values: { name: string }) => {
	// 	if (!selected || !activeSubsidiaryId) return;
	// 	await dispatch(
	// 		updateSupplier({
	// 			subsidiaryId: activeSubsidiaryId,
	// 			data: { id: selected.id, name: values.name },
	// 		}),
	// 	);
	// 	setEditOpen(false);
	// 	setSelected(null);
	// };

	const handleDeleteConfirm = async () => {
		if (!selected || !activeSubsidiaryId) return;
		await dispatch(deleteSupplier({ subsidiaryId: activeSubsidiaryId, id: selected.id }));
		setDeleteOpen(false);
		setSelected(null);
	};

	const handleView = (supplier: ISupplier) => {
		navigate(`/catalogos/proveedores/${supplier.id}`);
	};

	const handleEdit = (supplier: ISupplier) => {
		setSelected(supplier);
		setEditOpen(true);
	};

	const handleDelete = (supplier: ISupplier) => {
		setSelected(supplier);
		setDeleteOpen(true);
	};

	// ── Verificación de acceso ────────────────────────────────────────────
	const hasBranchAccess = canAccessBranch(currentBranchId);

	return (
		<PageWrapper name='proveedores-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
							<Icon
								icon='HeroTruck'
								className='h-6 w-6 text-orange-600 dark:text-orange-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Proveedores
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de proveedores y condiciones comerciales
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission={ERP_PERMISSIONS.CATALOGS.SUPPLIERS.CREATE}
						branchId={currentBranchId}
						scope='access'
						fallbackMode='hidden'
						color='amber'
						onClick={() => setCreateOpen(true)}
						icon='HeroPlus'>
						Nuevo Proveedor
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

				<SupplierStats items={suppliers as any} />
				<SuppliersFilters
					filters={filters}
					onFilterChange={handleFilterChange}
					onClear={handleClearFilters}
				/>
				<SuppliersTable
					suppliers={suppliers}
					loading={loading}
					onView={handleView}
					// onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Container>

			<CrearProveedor
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
				defaultSubsidiaryId={subsidiaryId}
			/>
			{/* <EditarProveedor
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				supplier={selected}
				onSubmit={handleEditSubmit}
			/> */}
			<EliminarProveedor
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				supplier={selected}
				onConfirm={handleDeleteConfirm}
			/>
		</PageWrapper>
	);
};

export default Proveedores;
