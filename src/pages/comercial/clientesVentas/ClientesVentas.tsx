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
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';

const ClientesVentas = () => {
	const dispatch = useAppDispatch();

	const { overview, loading } = useAppSelector((s) => s.customerSales);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const hasSubsidiary = subsidiaryId !== null;
	const [openCreate, setOpenCreate] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [deleteId, setDeleteId] = useState<number | string | null>(null);

	const navigate = useNavigate();

	const handleDelete = (id: number) => {
		if (!hasSubsidiary) return;
		setDeleteId(id);
		setOpenDelete(true);
	};

	const handleView = (id: number) => {
		navigate(`/comercial/clientes-ventas/${id}`);
	};

	useEffect(() => {
		if (!subsidiaryId) return;
		dispatch(fetchCustomersOverviewThunk({ subsidiary: subsidiaryId }));
	}, [dispatch, subsidiaryId]);

	return (
		<PageWrapper title='Clientes ventas' name='Clientes ventas'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<Badge className='text-2xl font-semibold mb-1'>Clientes Ventas</Badge>
						<p className="text-zinc-500 text-sm">Consulta y administra los clientes de ventas registrados.</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Tooltip text='Nuevo Cliente' placement='top-start'>
						<Button
							variant="solid"
							icon="HeroPlus"
							onClick={() => hasSubsidiary && setOpenCreate(true)}
							isDisable={!hasSubsidiary}
						>
						</Button>
					</Tooltip>
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
			{hasSubsidiary && (
				<>
					<CreateCustomerSaleModal
						isOpen={openCreate}
						setIsOpen={setOpenCreate}
						subsidiaryId={subsidiaryId}
					/>

					<DeleteCustomerSaleModal
						isOpen={openDelete}
						setIsOpen={setOpenDelete}
						customerId={deleteId}
						subsidiaryId={subsidiaryId}
					/>
				</>
			)}
		</PageWrapper>
	);
};

export default ClientesVentas;
