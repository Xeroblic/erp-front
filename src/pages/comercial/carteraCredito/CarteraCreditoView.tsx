import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Pagination from '@/components/ui/Pagination';
import ProtectedButton from '@/components/ui/ProtectedButton';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import type { IDeferredPaymentCreditProfileListItem } from '@/interface/deferredPayments.interface';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import { formatDeferredPaymentAmount } from '@/pages/comercial/pagosDiferidos/utils';
import CreditProfileEditModal from './components/CreditProfileEditModal';
import useCarteraCredito from './hooks/useCarteraCredito';
import type { CreditProfileStatusFilter } from './types';

const statusOptions: TSelectOption[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'active', label: 'Vigentes' },
	{ value: 'suspended', label: 'Suspendidos' },
];
const perPageOptions: TSelectOption[] = [
	{ value: '20', label: '20 por página' },
	{ value: '50', label: '50 por página' },
	{ value: '100', label: '100 por página' },
];
const getCustomerName = (row: IDeferredPaymentCreditProfileListItem): string =>
	row.customer?.billing_company ?? row.customer?.contact_name ?? 'Cliente sin nombre';
const formatAmount = (amount: string | null): string =>
	amount === null ? '—' : formatDeferredPaymentAmount(amount);
const getSelectValue = (option: unknown, fallback: string): string =>
	option !== null &&
	typeof option === 'object' &&
	!Array.isArray(option) &&
	'value' in option &&
	typeof option.value === 'string'
		? option.value
		: fallback;

const CarteraCreditoView: React.FC = () => {
	const { data, state, filters, actions, branch } = useCarteraCredito();
	const navigate = useNavigate();
	const [editingProfile, setEditingProfile] =
		useState<IDeferredPaymentCreditProfileListItem | null>(null);
	const selectedStatus =
		statusOptions.find((option) => option.value === filters.status) ?? statusOptions[0];
	const selectedPerPage =
		perPageOptions.find((option) => option.value === String(filters.values.per_page)) ??
		perPageOptions[0];
	const openCustomer = useCallback(
		(customerSaleId: number) => navigate(`/comercial/clientes-ventas/${customerSaleId}`),
		[navigate],
	);
	const openDocuments = useCallback(
		(customerSaleId: number) =>
			navigate(`/comercial/pagos-diferidos?customer_sale_id=${customerSaleId}`),
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
							</CardHeader>
							<CardBody>
								<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
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
												filters.setStatus(
													getSelectValue(
														option,
														'all',
													) as CreditProfileStatusFilter,
												)
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
											<Th className='text-right'>Acciones</Th>
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
														No hay perfiles de crédito para los filtros
														aplicados.
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
													<Td className='text-right tabular-nums'>
														{row.credit_limit === null
															? 'Sin techo'
															: formatAmount(row.credit_limit)}
													</Td>
													<Td className='text-right font-semibold tabular-nums'>
														{formatAmount(row.outstanding_balance)}
													</Td>
													<Td className='text-right tabular-nums'>
														{!row.is_active
															? 'Suspendido'
															: formatAmount(row.available_credit)}
													</Td>
													<Td>
														<span
															className={
																row.is_active
																	? 'text-emerald-700 dark:text-emerald-300'
																	: 'text-amber-700 dark:text-amber-300'
															}>
															{row.is_active
																? 'Vigente'
																: 'Suspendido'}
														</span>
													</Td>
													<Td>
														<div className='flex justify-end gap-1'>
															<Button
																size='xs'
																variant='ghost'
																icon='HeroDocumentText'
																aria-label={`Ver documentos de ${getCustomerName(row)}`}
																title='Ver documentos'
																onClick={() =>
																	openDocuments(
																		row.customer_sale_id,
																	)
																}
															/>
															<ProtectedButton
																size='xs'
																variant='ghost'
																icon='HeroPencilSquare'
																permission={
																	ERP_PERMISSIONS
																		.DEFERRED_PAYMENTS.UPDATE
																}
																branchId={branch.branchId}
																subsidiaryId={branch.subsidiaryId}
																scope='access'
																aria-label={`Editar crédito de ${getCustomerName(row)}`}
																title='Editar condiciones'
																onClick={() =>
																	setEditingProfile(row)
																}
															/>
														</div>
													</Td>
												</Tr>
											))}
									</TBody>
								</Table>
							</CardBody>
							{data.meta && (
								<div className='flex flex-wrap items-center justify-between gap-3 border-t p-4'>
									<SelectReact
										name='per-page'
										aria-label='Resultados por página'
										options={perPageOptions}
										value={selectedPerPage}
										onChange={(option) =>
											filters.setPagination(
												1,
												Number(getSelectValue(option, '20')),
											)
										}
										isClearable={false}
									/>
									<Pagination
										currentPage={data.meta.current_page}
										totalPages={data.meta.last_page}
										onPageChange={(page) =>
											filters.setPagination(page, data.meta?.per_page ?? 20)
										}
									/>
								</div>
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
