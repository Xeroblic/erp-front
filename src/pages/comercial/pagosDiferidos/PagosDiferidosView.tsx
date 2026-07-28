import React, { useCallback } from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import DeferredPaymentDetailDrawer from './components/drawers/DeferredPaymentDetailDrawer';
import DeferredPaymentsFilters from './components/filters/DeferredPaymentsFilters';
import DeferredPaymentsKpis from './components/kpis/DeferredPaymentsKpis';
import DeferredPaymentsTable from './components/tables/DeferredPaymentsTable';
import usePagosDiferidos from './hooks/usePagosDiferidos';

const PagosDiferidosView: React.FC = () => {
	const { data, state, filters, selection, actions } = usePagosDiferidos();
	const setDeferredPaymentsFilter = filters.setFilter;
	const handlePaginationChange = useCallback(
		(page: number, perPage: number) => setDeferredPaymentsFilter({ page, per_page: perPage }),
		[setDeferredPaymentsFilter],
	);

	return (
		<PageWrapper isProtectedRoute title='Pagos diferidos'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroBanknotes' />
					<span>Comercial / Pagos diferidos</span>
				</SubheaderLeft>
			</Subheader>
			<Container className='space-y-4'>
				{!state.hasDataContext ? (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroBuildingStorefront'
						title='No se pudo resolver la subsidiaria'>
						Seleccion&aacute; nuevamente el contexto comercial para consultar las
						cuentas por cobrar.
					</Alert>
				) : (
					<>
						{state.isMockMode && (
							<Alert
								color='amber'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='Datos ficticios para demostraci&oacute;n'>
								Los documentos, empresas, RUT y montos mostrados son ficticios y no
								deben utilizarse para realizar cobranzas.
							</Alert>
						)}
						{state.errorSummary && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos cargar el resumen de cobranza'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<span>{state.errorSummary}</span>
									<Button
										size='sm'
										variant='outline'
										onClick={actions.retrySummary}>
										Reintentar
									</Button>
								</div>
							</Alert>
						)}
						{!state.errorSummary && (
							<DeferredPaymentsKpis
								summary={data.summary}
								loading={state.loadingSummary}
							/>
						)}
						<DeferredPaymentsFilters
							filters={filters.values}
							search={filters.search}
							hasInvalidDateRange={filters.hasInvalidDateRange}
							onSearchChange={filters.setSearch}
							onChange={filters.setFilter}
							onReset={filters.reset}
						/>
						{state.error &&
							!filters.hasInvalidDateRange &&
							!filters.isSearchDebouncing && (
								<Alert
									color='red'
									variant='outline'
									icon='HeroExclamationTriangle'
									title='No pudimos cargar los pagos diferidos'>
									<div className='flex flex-wrap items-center justify-between gap-3'>
										<span>{state.error}</span>
										<Button
											size='sm'
											variant='outline'
											onClick={actions.retryList}>
											Reintentar
										</Button>
									</div>
								</Alert>
							)}
						{!filters.hasInvalidDateRange && (
							<DeferredPaymentsTable
								rows={data.list}
								meta={data.meta}
								loading={state.loading}
								hasError={Boolean(state.error)}
								hasFilters={filters.hasFilters}
								onPaginationChange={handlePaginationChange}
								onRowClick={selection.openDetail}
							/>
						)}
					</>
				)}
			</Container>
			<DeferredPaymentDetailDrawer
				documentId={selection.selectedId}
				onClose={selection.closeDetail}
			/>
		</PageWrapper>
	);
};

export default PagosDiferidosView;
