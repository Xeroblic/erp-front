import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../../components/layouts/Subheader/Subheader';
import Container from '../../../components/layouts/Container/Container';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/icon/Icon';
import { ICustomerSupplierFilters } from './components/types';
import type { ICustomerSupplier } from '@/interface/customerSupplier.interface';
import { useClientes } from './components/hooks/useClientes';
import CustomersTable from './components/tables/CustomersTable';
import CrearCliente from './components/modals/CrearCliente';
// import EditarCliente from './components/modals/EditarCliente';
import EliminarCliente from './components/modals/EliminarCliente';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';
import {
	createCustomerSupplier,
	updateCustomerSupplier,
	deleteCustomerSupplier,
} from '@/store/slices/customerSuppliers/customerSuppliersSlice';

const Clientes: React.FC = () => {
	const navigate = useNavigate();
	const currentUser = useAppSelector((state) => state.auth.user);
	const personalizacionUsuario = useAppSelector(selectPersonalizacionUsuario);

	// 🎯 Inicializar subsidiaryId INMEDIATAMENTE con el valor de personalización
	const [subsidiaryId, setSubsidiaryId] = useState<number | null>(() => {
		// Si ya tenemos la personalización, usarla de inmediato
		return personalizacionUsuario?.sucursal_principal ?? null;
	});

	const [filters] = useState<ICustomerSupplierFilters>({ search: '' });
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [selected, setSelected] = useState<ICustomerSupplier | null>(null);

	const { customers, loading, activeSubsidiaryId } = useClientes({ subsidiaryId, filters });
	const dispatch = useAppDispatch();

	// Actualizar subsidiaryId cuando cambia la personalización (solo si aún no está establecido)
	useEffect(() => {
		const principal = personalizacionUsuario?.sucursal_principal;
		if (principal && !subsidiaryId) {
			setSubsidiaryId(principal);
		}
	}, [personalizacionUsuario?.sucursal_principal, subsidiaryId]);

	// Escuchar cambios externos de subsidiary (cuando cambia en el selector)
	useEffect(() => {
		const handleExternalSubsidiaryChange = (event: Event) => {
			const customEvent = event as CustomEvent<{ branchId: number | null }>;
			const nextSubsidiaryId = customEvent.detail?.branchId ?? null;
			if (nextSubsidiaryId === null) return;
			setSubsidiaryId(nextSubsidiaryId);
		};

		window.addEventListener('user-branch-changed', handleExternalSubsidiaryChange);
		return () =>
			window.removeEventListener('user-branch-changed', handleExternalSubsidiaryChange);
	}, []);

	const onCreate = () => setCreateOpen(true);
	const onView = (c: ICustomerSupplier) => {
		// Navegar a la página de detalle del cliente
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
					<Button color='blue' onClick={onCreate} icon='HeroPlus'>
						Nuevo Cliente
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
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
