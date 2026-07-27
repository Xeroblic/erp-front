import React, { useCallback } from 'react';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import OffCanvas, { OffCanvasBody, OffCanvasHeader } from '@/components/ui/OffCanvas';
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
			<OffCanvas
				isOpen={selection.selectedId !== null}
				setIsOpen={() => selection.closeDetail()}>
				<OffCanvasHeader className='border-b border-zinc-200 dark:border-zinc-800'>
					<div>
						<p className='text-lg font-semibold'>Detalle del documento</p>
						<p className='text-sm font-normal text-zinc-500'>
							Vista completa disponible en ZF-6
						</p>
					</div>
				</OffCanvasHeader>
				<OffCanvasBody className='p-6'>
					<div className='rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900'>
						<div className='flex items-center gap-3'>
							<div className='flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white'>
								<Icon icon='HeroDocumentText' color='white' size='text-2xl' />
							</div>
							<div>
								<p className='text-sm text-zinc-500'>Documento seleccionado</p>
								<p className='text-xl font-semibold'>ID #{selection.selectedId}</p>
							</div>
						</div>
						<p className='mt-4 text-sm text-zinc-600 dark:text-zinc-300'>
							En ZF-6 se mostrar&aacute;n aqu&iacute; los &iacute;tems, abonos,
							adjuntos y acciones del documento.
						</p>
					</div>
				</OffCanvasBody>
			</OffCanvas>
		</PageWrapper>
	);
};

export default PagosDiferidosView;
