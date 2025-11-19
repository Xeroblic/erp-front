import React, { useEffect, useState } from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomersOverviewThunk } from '@/store/slices/customerSales/customerSalesSlice';
import ClienteVentasTable from './components/tables/ClienteVentasTable';
import { useNavigate } from 'react-router-dom';
import DeleteCustomerSaleModal from './components/modals/DeleteCustomerSaleModal';
import CreateCustomerSaleModal from './components/modals/CreateCustomerSaleModal';

const ClientesVentas = () => {
	const dispatch = useAppDispatch();

	const { overview, loading } = useAppSelector((s) => s.customerSales);
	const [openCreate, setOpenCreate] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [deleteId, setDeleteId] = useState<number | string | null>(null);

	const navigate = useNavigate();

	const handleDelete = (id: number) => {
		setDeleteId(id);
		setOpenDelete(true);
	};

	const handleView = (id: number) => {
		navigate(`/comercial/clientes-ventas/${id}`);
	};

	useEffect(() => {
		dispatch(fetchCustomersOverviewThunk({ subsidiary: 1 })); // CAMBIAR EL ID
	}, [dispatch]);

	return (
		<PageWrapper>
			<Subheader>
				<SubheaderLeft>
					<h2 className='text-2xl font-semibold'>Clientes Ventas</h2>
				</SubheaderLeft>
				<SubheaderRight>
					<Button variant='outline' onClick={() => setOpenCreate(true)}>
						Nuevo Cliente
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card className='border border-zinc-200 dark:border-zinc-700'>
					<CardBody>
						<ClienteVentasTable
							data={overview}
							loading={loading}
							onDelete={handleDelete}
							onView={handleView}
						/>
					</CardBody>
				</Card>
			</Container>
			<CreateCustomerSaleModal
				isOpen={openCreate}
				setIsOpen={setOpenCreate}
				subsidiaryId={1}
			/>

			<DeleteCustomerSaleModal
				isOpen={openDelete}
				setIsOpen={setOpenDelete}
				customerId={deleteId}
				subsidiaryId={1}
			/>
		</PageWrapper>
	);
};

export default ClientesVentas;
