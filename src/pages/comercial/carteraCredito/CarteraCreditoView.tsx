import React, { useCallback, useState } from 'react';
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
import type { IDeferredPaymentCreditProfileListItem } from '@/interface/deferredPayments.interface';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import { formatDeferredPaymentAmount } from '@/pages/comercial/pagosDiferidos/utils';
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
	const [editingProfile, setEditingProfile] =
		useState<IDeferredPaymentCreditProfileListItem | null>(null);
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

	return (
		<PageWrapper isProtectedRoute title='Cartera de crédito'>
			<Subheader>
				<SubheaderLeft>
					<Icon icon='HeroCreditCard' />
					<span>Comercial / Pagos diferidos / Cartera de crédito</span>
				</SubheaderLeft>
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
											<Th>Cliente</Th>
											<Th className='text-right'>Plazo</Th>
											<Th className='text-right'>Cupo</Th>
											<Th className='text-right'>Usado</Th>
											<Th className='text-right'>Disponible</Th>
											<Th>Estado</Th>
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
											data.rows.map((row) => (
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
																		setEditingProfile(row)
																	}>
																	<Icon
																		icon='HeroPencil'
																		color='white'
																		className='text-xl'
																	/>
																</ProtectedButton>
															</Tooltip>
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
			<CreditProfileEditModal
				profile={editingProfile}
				subsidiaryId={branch.subsidiaryId}
				branchId={branch.branchId}
				onClose={() => setEditingProfile(null)}
				onSaved={actions.refresh}
			/>
		</PageWrapper>
	);
};

export default CarteraCreditoView;
