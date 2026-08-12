import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import useContextScopedSelection, {
	type OrganizationalContext,
} from '@/hooks/useContextScopedSelection';
import CreateCustomerSaleModal from './components/modals/CreateCustomerSaleModal';
import DeleteCustomerSaleModal from './components/modals/DeleteCustomerSaleModal';
import ClientesVentasFilters from './components/filters/ClientesVentasFilters';
import ClienteVentasTable from './components/tables/ClienteVentasTable';
import useClientesVentas from './hooks/useClientesVentas';

const ClientesVentas = () => {
	const navigate = useNavigate();
	const { data, state, filters, actions, branch } = useClientesVentas();
	const currentContext = useMemo<OrganizationalContext | null>(
		() =>
			branch.subsidiaryId === null ? null : { type: 'subsidiary', id: branch.subsidiaryId },
		[branch.subsidiaryId],
	);
	const createSelection = useContextScopedSelection<'create'>(currentContext);
	const deleteSelection = useContextScopedSelection<number>(currentContext);

	const handleDelete = useCallback(
		(id: number) => {
			if (branch.subsidiaryId === null) return;
			deleteSelection.select(id);
		},
		[branch.subsidiaryId, deleteSelection],
	);
	const handleView = useCallback(
		(id: number) => {
			navigate(`/comercial/clientes-ventas/${id}`);
		},
		[navigate],
	);
	const handlePaginationChange = useCallback(
		(page: number, perPage: number) => actions.setPage(page, perPage),
		[actions],
	);

	return (
		<PageWrapper isProtectedRoute title='Clientes ventas'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='DuoUser' />
					<span>Comercial / Clientes ventas</span>
				</SubheaderLeft>
				<SubheaderRight>
					<ProtectedButton
						permission={ERP_PERMISSIONS.CUSTOMER_SALES.CREATE}
						branchId={branch.branchId}
						subsidiaryId={branch.subsidiaryId}
						scope='access'
						variant='solid'
						color='blue'
						icon='HeroPlus'
						isDisable={!state.hasDataContext}
						onClick={() => createSelection.select('create')}>
						Nuevo cliente
					</ProtectedButton>
				</SubheaderRight>
			</Subheader>
			<Container className='space-y-4'>
				{!state.hasDataContext ? (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroBuildingStorefront'
						title='No se pudo resolver la subsidiaria'>
						Seleccioná nuevamente el contexto comercial para consultar los clientes.
					</Alert>
				) : (
					<>
						<ClientesVentasFilters
							search={filters.search}
							onSearchChange={filters.setSearch}
							onClear={filters.clearSearch}
						/>
						{state.error && !state.isSearchDebouncing && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos cargar los clientes'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<span>{state.error}</span>
									<Button size='sm' variant='outline' onClick={actions.retry}>
										Reintentar
									</Button>
								</div>
							</Alert>
						)}
						<ClienteVentasTable
							rows={data.overview}
							meta={data.meta}
							loading={state.loading || state.isSearchDebouncing}
							hasError={Boolean(state.error)}
							hasSearch={filters.hasSearch}
							onPaginationChange={handlePaginationChange}
							onDelete={handleDelete}
							onView={handleView}
							branchId={branch.branchId}
							subsidiaryId={branch.subsidiaryId}
						/>
					</>
				)}
			</Container>
			{createSelection.context !== null && (
				<CreateCustomerSaleModal
					isOpen={createSelection.isOpen}
					setIsOpen={(isOpen) => {
						if (!isOpen) createSelection.clear();
					}}
					subsidiaryId={createSelection.context.id}
					refreshStoreOnSuccess={false}
					onSuccess={() => actions.setPage(1)}
				/>
			)}
			{deleteSelection.context !== null && (
				<DeleteCustomerSaleModal
					isOpen={deleteSelection.isOpen}
					setIsOpen={(isOpen) => {
						if (!isOpen) deleteSelection.clear();
					}}
					customerId={deleteSelection.selectedId}
					subsidiaryId={deleteSelection.context.id}
					onDeleted={actions.refreshAfterDeletion}
				/>
			)}
		</PageWrapper>
	);
};

export default ClientesVentas;
