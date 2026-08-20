import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import ProtectedButton from '@/components/ui/ProtectedButton';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import Tooltip from '@/components/ui/Tooltip';
import TableCardFooterTemplateV2, {
	type TablePaginationController,
} from '@/templates/Table/TableFooterTemplateV2';
import type {
	DeferredPaymentCreditProfilesApiParams,
	IDeferredPaymentCreditProfileListItem,
} from '@/interface/deferredPayments.interface';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import useContextScopedSelection, {
	type OrganizationalContext,
} from '@/hooks/useContextScopedSelection';
import { formatDeferredPaymentAmount } from '@/pages/comercial/pagosDiferidos/utils';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import DeferredPaymentsExportDropdown from '../pagosDiferidos/components/parts/DeferredPaymentsExportDropdown';
import useDeferredPaymentsExport from '../pagosDiferidos/hooks/useDeferredPaymentsExport';
import CreditProfileEditModal from './components/CreditProfileEditModal';
import useCarteraCredito from './hooks/useCarteraCredito';
import type { CreditProfileStatusFilter } from './types';

const statusOptions: Array<TSelectOption & { value: CreditProfileStatusFilter }> = [
	{ value: 'all', label: 'Todos' },
	{ value: 'active', label: 'Vigentes' },
	{ value: 'suspended', label: 'Suspendidos' },
];
const getCustomerName = (row: IDeferredPaymentCreditProfileListItem): string =>
	row.customer?.billing_company ?? row.customer?.contact_name ?? 'Cliente sin nombre';
const getCustomerSearchText = (row: IDeferredPaymentCreditProfileListItem): string | undefined =>
	row.customer?.billing_company?.trim() || row.customer?.rut.trim() || undefined;
const formatAmount = (amount: string | null): string =>
	amount === null ? '—' : formatDeferredPaymentAmount(amount);
const getAmountColorClass = (amount: string | null): string =>
	amount?.trim().startsWith('-') ? 'text-red-600 dark:text-red-400' : '';
const isCreditProfileStatusFilter = (value: string): value is CreditProfileStatusFilter =>
	statusOptions.some((option) => option.value === value);
const getStatusFilter = (option: unknown): CreditProfileStatusFilter => {
	if (
		option !== null &&
		typeof option === 'object' &&
		!Array.isArray(option) &&
		'value' in option &&
		typeof option.value === 'string' &&
		isCreditProfileStatusFilter(option.value)
	)
		return option.value;
	return 'all';
};

type CreditSortKey =
	| 'customer'
	| 'payment_term_days'
	| 'credit_limit'
	| 'outstanding_balance'
	| 'available_credit'
	| 'status';
type CreditSortDirection = 'asc' | 'desc';
type CreditSortState = { key: CreditSortKey; direction: CreditSortDirection } | null;

interface CreditSortableHeaderProps {
	label: string;
	sortKey: CreditSortKey;
	sort: CreditSortState;
	onSort: (key: CreditSortKey) => void;
	align?: 'left' | 'center' | 'right';
}

const CreditSortIcon: React.FC<{ direction: CreditSortDirection | null }> = ({ direction }) => (
	<div className='flex shrink-0 flex-col' aria-hidden='true'>
		<svg
			viewBox='0 0 12 12'
			className={`h-3 w-3 ${direction === 'asc' ? 'text-primary-600' : 'text-gray-400'}`}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'>
			<path d='m2.5 7.5 3.5-3 3.5 3' />
		</svg>
		<svg
			viewBox='0 0 12 12'
			className={`-mt-1 h-3 w-3 ${direction === 'desc' ? 'text-primary-600' : 'text-gray-400'}`}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'>
			<path d='m2.5 4.5 3.5 3 3.5-3' />
		</svg>
	</div>
);

const CreditSortableHeader: React.FC<CreditSortableHeaderProps> = ({
	label,
	sortKey,
	sort,
	onSort,
	align = 'left',
}) => {
	const direction = sort?.key === sortKey ? sort.direction : null;
	const alignmentClasses = {
		left: { header: undefined, content: 'justify-start' },
		center: { header: 'text-center', content: 'justify-center' },
		right: { header: 'text-right', content: 'justify-end' },
	}[align];
	let ariaSort: React.AriaAttributes['aria-sort'] = 'none';
	if (direction === 'asc') ariaSort = 'ascending';
	if (direction === 'desc') ariaSort = 'descending';

	return (
		<Th className={alignmentClasses.header} aria-sort={ariaSort}>
			<button
				type='button'
				className={`flex w-full items-center space-x-2 ${alignmentClasses.content}`}
				aria-label={`Ordenar por ${label}`}
				onClick={() => onSort(sortKey)}>
				<span>{label}</span>
				<CreditSortIcon direction={direction} />
			</button>
		</Th>
	);
};

const getCreditSortValue = (
	row: IDeferredPaymentCreditProfileListItem,
	key: CreditSortKey,
): string | number | null => {
	switch (key) {
		case 'customer':
			return getCustomerName(row);
		case 'payment_term_days':
			return row.payment_term_days;
		case 'credit_limit':
			return row.credit_limit === null ? null : Number(row.credit_limit);
		case 'outstanding_balance':
			return Number(row.outstanding_balance);
		case 'available_credit':
			return row.available_credit === null ? null : Number(row.available_credit);
		case 'status':
			return row.is_active ? 'Vigente' : 'Suspendido';
		default:
			return null;
	}
};

const compareCreditRows = (
	left: IDeferredPaymentCreditProfileListItem,
	right: IDeferredPaymentCreditProfileListItem,
	sort: NonNullable<CreditSortState>,
): number => {
	const leftValue = getCreditSortValue(left, sort.key);
	const rightValue = getCreditSortValue(right, sort.key);
	if (leftValue === null) return rightValue === null ? 0 : 1;
	if (rightValue === null) return -1;
	const comparison =
		typeof leftValue === 'number' && typeof rightValue === 'number'
			? leftValue - rightValue
			: String(leftValue).localeCompare(String(rightValue), 'es', {
					numeric: true,
					sensitivity: 'base',
				});
	return sort.direction === 'asc' ? comparison : -comparison;
};

interface CreditPortfolioPaginationProps {
	meta: NonNullable<ReturnType<typeof useCarteraCredito>['data']['meta']>;
	loading: boolean;
	onChange: (page: number, perPage: number) => void;
}

const CreditPortfolioPagination: React.FC<CreditPortfolioPaginationProps> = ({
	meta,
	loading,
	onChange,
}) => {
	const pagination: PaginationState = {
		pageIndex: meta.current_page - 1,
		pageSize: meta.per_page,
	};
	const table: TablePaginationController = {
		getState: () => ({ pagination }),
		setPageSize: (updater) => {
			const pageSize = typeof updater === 'function' ? updater(pagination.pageSize) : updater;
			onChange(1, pageSize);
		},
		setPageIndex: (updater) => {
			const pageIndex =
				typeof updater === 'function' ? updater(pagination.pageIndex) : updater;
			onChange(pageIndex + 1, pagination.pageSize);
		},
		getCanPreviousPage: () => pagination.pageIndex > 0,
		previousPage: () => onChange(Math.max(1, meta.current_page - 1), pagination.pageSize),
		getPageCount: () => meta.last_page,
		getCanNextPage: () => meta.current_page < meta.last_page,
		nextPage: () => onChange(meta.current_page + 1, pagination.pageSize),
	};

	return <TableCardFooterTemplateV2 table={table} isDisabled={loading} />;
};

const CarteraCreditoView: React.FC = () => {
	const { data, state, filters, actions, branch } = useCarteraCredito();
	const navigate = useNavigate();
	const currentContext = useMemo<OrganizationalContext | null>(
		() =>
			branch.subsidiaryId === null ? null : { type: 'subsidiary', id: branch.subsidiaryId },
		[branch.subsidiaryId],
	);
	const editingSelection = useContextScopedSelection<number>(currentContext);
	const [modalMode, setModalMode] = useState<'edit' | 'delete'>('edit');
	const editingProfile = useMemo(
		() =>
			editingSelection.selectedId === null
				? null
				: (data.rows.find((row) => row.customer_sale_id === editingSelection.selectedId) ??
					null),
		[data.rows, editingSelection.selectedId],
	);
	const [sort, setSort] = useState<CreditSortState>(null);
	useEffect(() => {
		setSort(null);
	}, [branch.subsidiaryId]);
	const exportDisabled = !state.hasDataContext || filters.isSearchDebouncing || sort !== null;
	const downloadCreditProfiles = useCallback(
		(params: DeferredPaymentCreditProfilesApiParams, signal: AbortSignal) => {
			if (branch.subsidiaryId === null) {
				return Promise.reject(
					new Error('No se pudo resolver la subsidiaria para exportar.'),
				);
			}
			return deferredPaymentsService.exportCreditProfiles(
				branch.subsidiaryId,
				params,
				signal,
			);
		},
		[branch.subsidiaryId],
	);
	const creditProfileExport = useDeferredPaymentsExport({
		disabled: exportDisabled,
		ownerContext: branch.subsidiaryId,
		download: downloadCreditProfiles,
	});
	const sortedRows = useMemo(
		() =>
			sort === null
				? data.rows
				: [...data.rows].sort((left, right) => compareCreditRows(left, right, sort)),
		[data.rows, sort],
	);
	const handleSort = (key: CreditSortKey) => {
		setSort((current) => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	};
	const selectedStatus =
		statusOptions.find((option) => option.value === filters.status) ?? statusOptions[0];
	const openCustomer = useCallback(
		(customerSaleId: number) => navigate(`/comercial/clientes-ventas/${customerSaleId}`),
		[navigate],
	);
	const openDocuments = useCallback(
		(customerName: string | undefined) =>
			navigate('/comercial/pagos-diferidos', {
				state: customerName ? { customerName } : undefined,
			}),
		[navigate],
	);
	const openCreditProfileEditor = useCallback(
		(customerSaleId: number) => {
			setModalMode('edit');
			editingSelection.select(customerSaleId);
		},
		[editingSelection],
	);
	const openCreditProfileDeletion = useCallback(
		(customerSaleId: number) => {
			setModalMode('delete');
			editingSelection.select(customerSaleId);
		},
		[editingSelection],
	);

	return (
		<PageWrapper isProtectedRoute title='Cartera de crédito'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroCreditCard' />
					<span>Comercial / Pagos diferidos / Cartera de crédito</span>
				</SubheaderLeft>
				<DeferredPaymentsExportDropdown
					branchId={branch.branchId}
					subsidiaryId={branch.subsidiaryId}
					disabled={exportDisabled}
					isExporting={creditProfileExport.isExporting}
					onExportPage={() => creditProfileExport.exportPage(filters.requestFilters)}
					onExportAll={() => creditProfileExport.exportAll(filters.requestFilters)}
				/>
			</Subheader>
			<Container className='space-y-4'>
				{!state.hasDataContext ? (
					<Alert
						color='amber'
						variant='outline'
						icon='HeroBuildingStorefront'
						title='No se pudo resolver la subsidiaria'>
						Seleccioná nuevamente el contexto comercial para consultar la cartera de
						crédito.
					</Alert>
				) : (
					<>
						{creditProfileExport.error && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos exportar la cartera de crédito'>
								{creditProfileExport.error}
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
										Restablecé el orden de la tabla para exportar el mismo orden
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
						<Card>
							<CardHeader>
								<div className='flex items-center gap-2'>
									<Icon icon='DuoFilter' size='text-xl' />
									<CardTitle className='text-lg'>Filtros</CardTitle>
								</div>
								<Button
									variant='outline'
									size='sm'
									icon='HeroXMark'
									onClick={filters.reset}>
									Limpiar
								</Button>
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 md:grid-cols-3'>
									<div className='md:col-span-2'>
										<label
											htmlFor='credit-profile-search'
											className='mb-1 block text-sm font-medium'>
											Buscar cliente o RUT
										</label>
										<Input
											id='credit-profile-search'
											name='search'
											value={filters.search}
											onChange={(event) =>
												filters.setSearch(event.target.value)
											}
											placeholder='Razón social o RUT'
										/>
										<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
											La búsqueda se aplica automáticamente.
										</p>
									</div>
									<div>
										<label
											htmlFor='credit-profile-status'
											className='mb-1 block text-sm font-medium'>
											Estado del crédito
										</label>
										<SelectReact
											inputId='credit-profile-status'
											name='active'
											options={statusOptions}
											value={selectedStatus}
											onChange={(option) =>
												filters.setStatus(getStatusFilter(option))
											}
											isClearable={false}
										/>
									</div>
								</div>
							</CardBody>
						</Card>
						{state.error && (
							<Alert
								color='red'
								variant='outline'
								icon='HeroExclamationTriangle'
								title='No pudimos cargar la cartera de crédito'>
								<div className='flex items-center justify-between gap-3'>
									<span>{state.error}</span>
									<Button size='sm' variant='outline' onClick={actions.retry}>
										Reintentar
									</Button>
								</div>
							</Alert>
						)}
						<Card>
							<CardHeader>
								<CardTitle className='text-lg'>Cartera de crédito</CardTitle>
								{!state.error && (
									<span className='text-sm text-zinc-500'>
										{data.meta?.total ?? data.rows.length} clientes
									</span>
								)}
							</CardHeader>
							<CardBody className='overflow-x-auto p-0'>
								<Table className='min-w-[1120px]'>
									<THead>
										<Tr>
											<CreditSortableHeader
												label='Cliente'
												sortKey='customer'
												sort={sort}
												onSort={handleSort}
											/>
											<CreditSortableHeader
												label='Plazo'
												sortKey='payment_term_days'
												sort={sort}
												onSort={handleSort}
												align='right'
											/>
											<CreditSortableHeader
												label='Cupo'
												sortKey='credit_limit'
												sort={sort}
												onSort={handleSort}
												align='right'
											/>
											<CreditSortableHeader
												label='Usado'
												sortKey='outstanding_balance'
												sort={sort}
												onSort={handleSort}
												align='right'
											/>
											<CreditSortableHeader
												label='Disponible'
												sortKey='available_credit'
												sort={sort}
												onSort={handleSort}
												align='right'
											/>
											<CreditSortableHeader
												label='Estado'
												sortKey='status'
												sort={sort}
												onSort={handleSort}
											/>
											<Th className='text-center'>Acciones</Th>
										</Tr>
									</THead>
									<TBody>
										{state.loading &&
											Array.from({ length: 5 }, (_, index) => (
												<Tr key={`loading-${index}`}>
													{Array.from({ length: 7 }, (__, cell) => (
														<Td key={cell}>
															<div className='h-4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700' />
														</Td>
													))}
												</Tr>
											))}
										{!state.loading &&
											!state.error &&
											data.rows.length === 0 && (
												<Tr>
													<Td colSpan={7} className='py-12 text-center'>
														<p className='font-medium text-zinc-700 dark:text-zinc-200'>
															Sin resultados para los filtros
															aplicados
														</p>
														<p className='mt-1 text-sm text-zinc-500'>
															Prueba ajustando o limpiando los
															filtros.
														</p>
													</Td>
												</Tr>
											)}
										{!state.loading &&
											!state.error &&
											sortedRows.map((row) => (
												<Tr
													key={row.id}
													className={
														row.credit_limit_exceeded
															? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/20'
															: ''
													}>
													<Td>
														<button
															type='button'
															className='text-left font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600'
															onClick={() =>
																openCustomer(row.customer_sale_id)
															}>
															{getCustomerName(row)}
														</button>
														<p className='text-xs text-zinc-500'>
															{row.customer?.rut ??
																'RUT no disponible'}
														</p>
														{row.credit_limit_exceeded && (
															<p className='mt-1 text-xs font-semibold text-red-700 dark:text-red-300'>
																Cupo excedido
															</p>
														)}
													</Td>
													<Td className='text-right tabular-nums'>
														{row.payment_term_days} días
													</Td>
													<Td
														className={`text-right tabular-nums ${getAmountColorClass(
															row.credit_limit,
														)}`}>
														{row.credit_limit === null
															? 'Sin techo'
															: formatAmount(row.credit_limit)}
													</Td>
													<Td
														className={`text-right font-semibold tabular-nums ${getAmountColorClass(
															row.outstanding_balance,
														)}`}>
														{formatAmount(row.outstanding_balance)}
													</Td>
													<Td
														className={`text-right tabular-nums ${getAmountColorClass(
															row.available_credit,
														)}`}>
														{!row.is_active
															? 'Suspendido'
															: formatAmount(row.available_credit)}
													</Td>
													<Td className='text-center'>
														<span
															className={
																row.is_active
																	? 'inline-flex min-w-24 justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm'
																	: 'inline-flex min-w-24 justify-center rounded-full bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm'
															}>
															{row.is_active
																? 'Vigente'
																: 'Suspendido'}
														</span>
													</Td>
													<Td>
														<div className='flex justify-center gap-1'>
															<Tooltip
																text='Ver cliente'
																placement='top-end'>
																<Button
																	variant='solid'
																	size='sm'
																	color='amber'
																	className='bg-amber-600 p-1 hover:bg-amber-700/30'
																	aria-label={`Ver cliente ${getCustomerName(row)}`}
																	onClick={() =>
																		openCustomer(
																			row.customer_sale_id,
																		)
																	}>
																	<Icon
																		icon='HeroEye'
																		color='white'
																		className='text-xl'
																	/>
																</Button>
															</Tooltip>
															<Tooltip
																text='Ver documentos'
																placement='top-end'>
																<Button
																	variant='outline'
																	size='sm'
																	color='violet'
																	className='bg-violet-600 p-1 hover:bg-violet-700/30'
																	aria-label={`Ver documentos de ${getCustomerName(row)}`}
																	onClick={() =>
																		openDocuments(
																			getCustomerSearchText(
																				row,
																			),
																		)
																	}>
																	<Icon
																		icon='HeroDocumentText'
																		color='white'
																		className='text-xl'
																	/>
																</Button>
															</Tooltip>
															<Tooltip
																text='Editar condiciones'
																placement='top-end'>
																<ProtectedButton
																	variant='solid'
																	size='sm'
																	color='green'
																	className='bg-green-600 p-1 hover:bg-green-700/20'
																	permission={
																		ERP_PERMISSIONS
																			.DEFERRED_PAYMENTS
																			.UPDATE
																	}
																	branchId={branch.branchId}
																	subsidiaryId={
																		branch.subsidiaryId
																	}
																	scope='access'
																	aria-label={`Editar crédito de ${getCustomerName(row)}`}
																	onClick={() =>
																		openCreditProfileEditor(
																			row.customer_sale_id,
																		)
																	}>
																	<Icon
																		icon='HeroPencil'
																		color='white'
																		className='text-xl'
																	/>
																</ProtectedButton>
															</Tooltip>
															{!row.is_active && (
																<Tooltip
																	text='Eliminar perfil de crédito'
																	placement='top-end'>
																	<ProtectedButton
																		variant='solid'
																		size='sm'
																		color='red'
																		className='bg-red-600 p-1 hover:bg-red-700/20'
																		permission={
																			ERP_PERMISSIONS
																				.DEFERRED_PAYMENTS
																				.DELETE
																		}
																		branchId={branch.branchId}
																		subsidiaryId={
																			branch.subsidiaryId
																		}
																		scope='access'
																		aria-label={`Eliminar crédito de ${getCustomerName(row)}`}
																		onClick={() =>
																			openCreditProfileDeletion(
																				row.customer_sale_id,
																			)
																		}>
																		<Icon
																			icon='HeroTrash'
																			color='white'
																			className='text-xl'
																		/>
																	</ProtectedButton>
																</Tooltip>
															)}
														</div>
													</Td>
												</Tr>
											))}
									</TBody>
								</Table>
							</CardBody>
							{data.meta && (
								<CreditPortfolioPagination
									meta={data.meta}
									loading={state.loading}
									onChange={filters.setPagination}
								/>
							)}
						</Card>
					</>
				)}
			</Container>
			{editingSelection.context !== null && editingProfile !== null && (
				<CreditProfileEditModal
					profile={editingProfile}
					subsidiaryId={editingSelection.context.id}
					branchId={branch.branchId}
					onClose={editingSelection.clear}
					onSaved={actions.refresh}
					onDeleted={actions.refreshAfterDeletion}
					initialDeleteConfirmation={modalMode === 'delete'}
				/>
			)}
		</PageWrapper>
	);
};

export default CarteraCreditoView;
