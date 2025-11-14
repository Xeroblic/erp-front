import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { ISupplierFilters } from './components/types';
import type { ISupplier } from '@/interface/supplier.interface';
import { useProveedores } from './components/hooks/useProveedores';
import SupplierStats from './components/SupplierStats';
import SuppliersFilters from './components/SuppliersFilters';
import SuppliersTable from './components/tables/SuppliersTable';
import CrearProveedor from './components/modals/CrearProveedor';
// import EditarProveedor from './components/modals/EditarProveedor';
import EliminarProveedor from './components/modals/EliminarProveedor';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import {
	createSupplier,
	updateSupplier,
	deleteSupplier,
} from '@/store/slices/suppliers/suppliersSlice';
import { useUserBranches } from '@/pages/catalogos/productos/components/modals/hooks/userBranch';

const Proveedores: React.FC = () => {
	const navigate = useNavigate();
	const currentUser = useAppSelector((state) => state.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	const [subsidiaryId, setSubsidiaryId] = useState<number | null>(
		personalizacionUsuario?.subsidiary_id ??
			currentUser?.subsidiary?.id ??
			currentUser?.branch?.subsidiary?.id ??
			null,
	);

	const userId = currentUser?.id ?? (currentUser as any)?.pk ?? undefined;
	const { branches } = useUserBranches(userId, { enabled: Boolean(userId) });

	const branchToSubsidiary = useMemo(() => {
		const map = new Map<number, number>();
		branches.forEach((branch) => {
			if (branch?.id && branch?.subsidiaryId) {
				map.set(branch.id, branch.subsidiaryId);
			}
		});
		return map;
	}, [branches]);

	const preferredBranchId = useMemo(() => {
		if (personalizacionUsuario?.sucursal_principal) return personalizacionUsuario.sucursal_principal;
		if (currentUser?.branch?.id) return currentUser.branch.id;
		if (currentUser?.branch_id) return currentUser.branch_id;
		return null;
	}, [personalizacionUsuario?.sucursal_principal, currentUser?.branch?.id, currentUser?.branch_id]);

	const defaultSubsidiaryId = useMemo(() => {
		if (personalizacionUsuario?.subsidiary_id) return personalizacionUsuario.subsidiary_id;
		if (currentUser?.subsidiary?.id) return currentUser.subsidiary.id;

		if (preferredBranchId && branchToSubsidiary.has(preferredBranchId)) {
			return branchToSubsidiary.get(preferredBranchId) ?? null;
		}

		const branchSubsidiaryId =
			currentUser?.branch?.subsidiary?.id ?? (currentUser?.branch as any)?.subsidiary_id ?? null;
		if (branchSubsidiaryId) return branchSubsidiaryId;

		const accessSubs = (currentUser as any)?.access?.subsidiaries;
		if (Array.isArray(accessSubs)) {
			for (const sub of accessSubs) {
				if (sub && typeof sub === 'object' && sub.id) return sub.id;
				if (typeof sub === 'number') return sub;
			}
		}

		const firstAvailable = branches.find((branch) => branch.subsidiaryId)?.subsidiaryId ?? null;
		return firstAvailable ?? null;
	}, [branchToSubsidiary, branches, currentUser, personalizacionUsuario?.subsidiary_id, preferredBranchId]);

	useEffect(() => {
		if (subsidiaryId === null && defaultSubsidiaryId) {
			setSubsidiaryId(defaultSubsidiaryId);
		}
	}, [defaultSubsidiaryId, subsidiaryId]);

	const [filters, setFilters] = useState<ISupplierFilters>({
		search: '',
	});
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState<ISupplier | null>(null);

	const { suppliers, stats, loading, activeSubsidiaryId } = useProveedores({
		subsidiaryId,
		filters,
	});
	const dispatch = useAppDispatch();

	useEffect(() => {
		const principal = personalizacionUsuario?.subsidiary_id;
		if (principal && !subsidiaryId) {
			setSubsidiaryId(principal);
		}
	}, [personalizacionUsuario?.subsidiary_id, subsidiaryId]);

	useEffect(() => {
		const handleExternalSubsidiaryChange = (event: Event) => {
			const customEvent = event as CustomEvent<{
				branchId: number | null;
				subsidiaryId?: number | null;
			}>;
			const detail = customEvent.detail;
			const nextSubsidiaryId =
				detail?.subsidiaryId ??
				(detail?.branchId != null ? branchToSubsidiary.get(detail.branchId) ?? null : null);
			if (nextSubsidiaryId === null) return;
			setSubsidiaryId(nextSubsidiaryId);
		};

		window.addEventListener('user-branch-changed', handleExternalSubsidiaryChange);
		return () =>
			window.removeEventListener('user-branch-changed', handleExternalSubsidiaryChange);
	}, [branchToSubsidiary]);

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
					<Button color='amber' onClick={() => setCreateOpen(true)} icon='HeroPlus'>
						Nuevo Proveedor
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
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
