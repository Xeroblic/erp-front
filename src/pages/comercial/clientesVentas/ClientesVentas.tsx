import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PaginationState } from '@tanstack/react-table';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';

import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCustomersOverviewThunk,
	selectCustomerSalesMeta,
	selectCustomerSalesLinks,
} from '@/store/slices/customerSales/customerSalesSlice';
import ClienteVentasTable from './components/tables/ClienteVentasTable';
import DeleteCustomerSaleModal from './components/modals/DeleteCustomerSaleModal';
import CreateCustomerSaleModal from './components/modals/CreateCustomerSaleModal';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';

const ClientesVentas = () => {
	const dispatch = useAppDispatch();

	const { overview, loading } = useAppSelector((s) => s.customerSales);
	const meta = useAppSelector(selectCustomerSalesMeta);
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const hasSubsidiary = subsidiaryId !== null;

	const [openCreate, setOpenCreate] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [deleteId, setDeleteId] = useState<number | string | null>(null);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 5,
	});
	// const [isInitialLoad, setIsInitialLoad] = useState(true);

	const navigate = useNavigate();

	const handlePaginationChange = useCallback((updater: any) => {
		setPagination((old) => (typeof updater === 'function' ? updater(old) : updater));
	}, []);

	// Publicar la última página en la carga inicial (ELIMINADO para ordenar por fecha DESC)
	// useEffect(() => {
	// 	if (isInitialLoad && meta?.last_page) {
	// 		setPagination((prev) => ({
	// 			...prev,
	// 			pageIndex: meta.last_page - 1,
	// 		}));
	// 		setIsInitialLoad(false);
	// 	}
	// }, [meta?.last_page, isInitialLoad]);

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
		dispatch(
			fetchCustomersOverviewThunk({
				subsidiary: subsidiaryId,
				page: pagination.pageIndex + 1,
				per_page: pagination.pageSize,
			}),
		);
	}, [dispatch, subsidiaryId, pagination.pageIndex, pagination.pageSize]);

	return (
		<PageWrapper title='Clientes ventas' name='Clientes ventas'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<Badge className='mb-1 text-2xl font-semibold'>Clientes Ventas</Badge>
						<p className='text-sm text-zinc-500'>
							Consulta y administra los clientes de ventas registrados.
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Tooltip text='Nuevo Cliente' placement='top-start'>
						<Button
							variant='solid'
							icon='HeroPlus'
							onClick={() => hasSubsidiary && setOpenCreate(true)}
							isDisable={!hasSubsidiary}
						/>
					</Tooltip>
				</SubheaderRight>
			</Subheader>

			<Container>
				<Card className='border border-zinc-200 dark:border-zinc-700'>
					<CardBody>
						<ClienteVentasTable
							data={overview}
							loading={loading}
							meta={meta}
							pagination={pagination}
							onPaginationChange={handlePaginationChange}
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
