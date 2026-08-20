import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type {
	DeferredPaymentApiListParams,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import DeferredPaymentDetailDrawer from './components/drawers/DeferredPaymentDetailDrawer';
import DeferredPaymentsFilters from './components/filters/DeferredPaymentsFilters';
import DeferredPaymentsKpis from './components/kpis/DeferredPaymentsKpis';
import CreateEditDeferredPaymentModal from './components/modals/CreateEditDeferredPaymentModal';
import ReminderCadenceCard from './components/ReminderCadenceCard';
import DeferredPaymentsExportDropdown from './components/parts/DeferredPaymentsExportDropdown';
import DeferredPaymentsTable, {
	type DeferredPaymentsSortKey,
	type DeferredPaymentsSortState,
} from './components/tables/DeferredPaymentsTable';
import useDeferredPaymentsExport from './hooks/useDeferredPaymentsExport';
import usePagosDiferidos from './hooks/usePagosDiferidos';

const getCustomerNameFromNavigationState = (state: unknown): string | undefined => {
	if (state === null || typeof state !== 'object' || !('customerName' in state)) return undefined;
	const { customerName } = state as { customerName: unknown };
	return typeof customerName === 'string' ? customerName : undefined;
};

const PagosDiferidosView: React.FC = () => {
	const location = useLocation();
	const filteredCustomerName = getCustomerNameFromNavigationState(location.state);
	const { data, state, filters, selection, actions, branch } = usePagosDiferidos({
		initialSearch: filteredCustomerName,
	});
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingDocument, setEditingDocument] = useState<IDeferredPaymentDocument | null>(null);
	const [isReminderCadenceOpen, setIsReminderCadenceOpen] = useState(false);
	const [sort, setSort] = useState<DeferredPaymentsSortState>(null);
	const exportDisabled =
		!state.hasDataContext ||
		filters.hasInvalidDateRange ||
		filters.isSearchDebouncing ||
		sort !== null;
	const downloadDocuments = useCallback(
		(params: DeferredPaymentApiListParams, signal: AbortSignal) => {
			if (branch.subsidiaryId === null) {
				return Promise.reject(
					new Error('No se pudo resolver la subsidiaria para exportar.'),
				);
			}
			return deferredPaymentsService.exportDocuments(branch.subsidiaryId, params, signal);
		},
		[branch.subsidiaryId],
	);
	const documentExport = useDeferredPaymentsExport({
		disabled: exportDisabled,
		ownerContext: branch.subsidiaryId,
		download: downloadDocuments,
	});
	const setDeferredPaymentsFilter = filters.setFilter;
	const handlePaginationChange = useCallback(
		(page: number, perPage: number) => setDeferredPaymentsFilter({ page, per_page: perPage }),
		[setDeferredPaymentsFilter],
	);
	const handleSort = useCallback((key: DeferredPaymentsSortKey) => {
		setSort((current) => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	}, []);
	useEffect(() => {
		setIsCreateOpen(false);
		setEditingDocument(null);
		setSort(null);
	}, [branch.subsidiaryId]);
	const closeForm = useCallback(() => {
		setIsCreateOpen(false);
		setEditingDocument(null);
	}, []);
	const editDocument = useCallback(
		(document: IDeferredPaymentDocument) => {
			selection.closeDetail();
			setEditingDocument(document);
		},
		[selection],
	);

	return (
		<PageWrapper isProtectedRoute title='Pagos diferidos'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroBanknotes' />
					<span>Comercial / Pagos diferidos</span>
				</SubheaderLeft>
				<SubheaderRight>
					<DeferredPaymentsExportDropdown
						branchId={branch.branchId}
						subsidiaryId={branch.subsidiaryId}
						disabled={exportDisabled}
						isExporting={documentExport.isExporting}
						onExportPage={() => documentExport.exportPage(filters.requestFilters)}
						onExportAll={() => documentExport.exportAll(filters.requestFilters)}
					/>
					<Button
						variant='outline'
						size='sm'
						icon='HeroBellAlert'
						onClick={() => setIsReminderCadenceOpen(true)}>
						Recordatorios
					</Button>
					<ProtectedButton
						permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.CREATE}
						scope='access'
						branchId={branch.branchId}
						subsidiaryId={branch.subsidiaryId}
						variant='solid'
						color='blue'
						icon='HeroPlus'
						isDisable={!state.hasDataContext}
						onClick={() => setIsCreateOpen(true)}>
						Nuevo documento
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
						Seleccion&aacute; nuevamente el contexto comercial para consultar las
						cuentas por cobrar.
					</Alert>
				) : (
					<>
						{documentExport.error && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos exportar los pagos diferidos'>
								{documentExport.error}
							</Alert>
						)}
						{sort !== null && (
							<Alert
								color='amber'
								variant='outline'
								icon='HeroArrowsUpDown'
								title='La exportación está pausada por el orden local'>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<span>
										Restablece el orden de la tabla para exportar el mismo orden
										que entrega el servidor.
									</span>
									<Button
										size='sm'
										variant='outline'
										onClick={() => setSort(null)}>
										Restablecer orden
									</Button>
								</div>
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
								sort={sort}
								onSort={handleSort}
								onPaginationChange={handlePaginationChange}
								onRowClick={selection.openDetail}
							/>
						)}
					</>
				)}
			</Container>
			<ReminderCadenceCard
				isOpen={isReminderCadenceOpen}
				setIsOpen={setIsReminderCadenceOpen}
			/>
			{(isCreateOpen || editingDocument !== null) && (
				<CreateEditDeferredPaymentModal
					isOpen
					deferredPaymentDocument={editingDocument}
					onClose={closeForm}
					onSaved={(savedDocument) => selection.openDetail(savedDocument.id)}
				/>
			)}
			<DeferredPaymentDetailDrawer
				documentId={selection.selectedId}
				selectionContext={selection.context}
				onClose={selection.closeDetail}
				onEdit={editDocument}
			/>
		</PageWrapper>
	);
};

export default PagosDiferidosView;
