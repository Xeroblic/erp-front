import React, { useState } from 'react';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../../components/layouts/Subheader/Subheader';
import Container from '../../../components/layouts/Container/Container';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/icon/Icon';
import { ICustomer, ICustomerFilters } from './components/types';
import { useClientes } from './components/hooks/useClientes';
import CustomersTable from './components/tables/CustomersTable';
import CrearCliente from './components/modals/CrearCliente';
import EditarCliente from './components/modals/EditarCliente';
import EliminarCliente from './components/modals/EliminarCliente';
import DetalleCliente from './components/modals/DetalleCliente';

const Clientes: React.FC = () => {
	const [filters] = useState<ICustomerFilters>({ search: '' });
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [selected, setSelected] = useState<ICustomer | null>(null);

	const { customers, loading } = useClientes(filters);

	const onCreate = () => setCreateOpen(true);
	const onView = (c: ICustomer) => {
		setSelected(c);
		setViewOpen(true);
	};
	const onEdit = (c: ICustomer) => {
		setSelected(c);
		setEditOpen(true);
	};
	const onDelete = (c: ICustomer) => {
		setSelected(c);
		setDeleteOpen(true);
	};

	const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const payload = Object.fromEntries(fd.entries());
		// create customer action (log removed)
		setCreateOpen(false);
	};

	const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!selected) return;
		const fd = new FormData(e.currentTarget);
		const payload = { id: selected.id, ...Object.fromEntries(fd.entries()) };
		// update customer action (log removed)
		setEditOpen(false);
		setSelected(null);
	};

	const handleConfirmDelete = () => {
		if (!selected) return;
		// delete customer action (log removed)
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
								Clientes
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
			/>
			<EditarCliente
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				customer={selected}
				onSubmit={handleEditSubmit}
			/>
			<EliminarCliente
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				customer={selected}
				onConfirm={handleConfirmDelete}
			/>
			<DetalleCliente isOpen={viewOpen} setIsOpen={setViewOpen} customer={selected} />
		</PageWrapper>
	);
};

export default Clientes;
