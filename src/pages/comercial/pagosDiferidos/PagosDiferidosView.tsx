import React from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import DeferredPaymentsFilters from './components/filters/DeferredPaymentsFilters';
import DeferredPaymentsKpis from './components/kpis/DeferredPaymentsKpis';
import DeferredPaymentsTable from './components/tables/DeferredPaymentsTable';
import { usePagosDiferidos } from './hooks/usePagosDiferidos';

const PagosDiferidosView: React.FC = () => {
	const { data, state, filters, actions } = usePagosDiferidos();

	return (
		<PageWrapper isProtectedRoute title='Pagos diferidos'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroBanknotes' />
					<span>Comercial / Pagos diferidos</span>
				</SubheaderLeft>
			</Subheader>
			<Container className='space-y-4'>
				{!state.hasValidBranch ? (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroBuildingStorefront'
						title={'Seleccion\u00E1 una sucursal'}>
						Necesit&aacute;s una sucursal activa para consultar las cuentas por cobrar.
					</Alert>
				) : (
					<>
						<DeferredPaymentsKpis
							summary={data.summary}
							loading={state.loadingSummary}
						/>
						<DeferredPaymentsFilters
							filters={filters.values}
							search={filters.search}
							onSearchChange={filters.setSearch}
							onChange={filters.setFilter}
							onReset={filters.reset}
						/>
						{state.error && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos cargar los pagos diferidos'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<span>{state.error}</span>
									<Button size='sm' variant='outline' onClick={actions.retry}>
										Reintentar
									</Button>
								</div>
							</Alert>
						)}
						<DeferredPaymentsTable
							rows={data.list}
							meta={data.meta}
							loading={state.loading}
							hasFilters={filters.hasFilters}
							onPaginationChange={(page, perPage) =>
								filters.setFilter({ page, per_page: perPage })
							}
						/>
					</>
				)}
			</Container>
		</PageWrapper>
	);
};

export default PagosDiferidosView;
