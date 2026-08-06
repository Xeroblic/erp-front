import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldArray, Form, FormikProvider } from 'formik';
import type { InputActionMeta } from 'react-select';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import type {
	IDeferredPaymentCreditProfile,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCustomersOverviewThunk } from '@/store/slices/customerSales/customerSalesSlice';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
import { formatCLP } from '@/utils/format.utils';
import getApiErrorMessage from '@/utils/apiError.utils';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import DeferredPaymentField from '../parts/DeferredPaymentField';
import DeferredPaymentSerialsInput from '../parts/DeferredPaymentSerialsInput';
import CustomerCreditProfileCard from '@/pages/comercial/clientesVentas/ClientesVentasDetalle/components/CustomerCreditProfileCard';
import useDeferredPaymentForm from '../../hooks/useDeferredPaymentForm';
import { createEmptyDeferredPaymentItem, DEFERRED_PAYMENT_TOTAL_ERROR } from '../../types';
import { DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS } from '../../utils';

interface CreateEditDeferredPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	deferredPaymentDocument?: IDeferredPaymentDocument | null;
	onSaved?: (document: IDeferredPaymentDocument) => void;
}

interface CustomerOptionData {
	id: number;
	label: string;
	isActive: boolean;
}

const MAX_DATE = new Date(2100, 11, 31);
const MAX_YEAR = 2100;

const hasValidationErrorOtherThan = (value: unknown, excludedMessage: string): boolean => {
	if (typeof value === 'string') return value !== excludedMessage;
	if (Array.isArray(value))
		return value.some((entry) => hasValidationErrorOtherThan(entry, excludedMessage));
	if (value !== null && typeof value === 'object')
		return Object.values(value).some((entry) =>
			hasValidationErrorOtherThan(entry, excludedMessage),
		);
	return false;
};
const documentTypeOptions: TSelectOption[] = Object.entries(
	DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));

const isSelectOption = (value: unknown): value is TSelectOption => {
	if (!value || typeof value !== 'object') return false;
	const option = value as Record<string, unknown>;
	return typeof option.value === 'string' && typeof option.label === 'string';
};

const asMultiOptions = (value: unknown): TSelectOption[] => {
	if (!Array.isArray(value)) return [];
	const candidates: unknown[] = value;
	return candidates.filter(isSelectOption);
};

const CreateEditDeferredPaymentModal: React.FC<CreateEditDeferredPaymentModalProps> = ({
	isOpen,
	onClose,
	deferredPaymentDocument = null,
	onSaved,
}) => {
	const dispatch = useAppDispatch();
	const customers = useAppSelector((state) => state.customerSales.overview);
	const customersLoading = useAppSelector((state) => state.customerSales.loading);
	const users = useAppSelector((state) => state.usersAdmin.users);
	const usersLoading = useAppSelector((state) => state.usersAdmin.loading.users);
	const { subsidiaryId } = useCurrentBranch();
	const [paymentTermDays, setPaymentTermDays] = useState(30);
	const [customerSearch, setCustomerSearch] = useState('');
	const [debouncedCustomerSearch] = useDebounce(customerSearch, 300);
	const [selectedCustomerOption, setSelectedCustomerOption] = useState<CustomerOptionData | null>(
		null,
	);
	const [creditProfile, setCreditProfile] = useState<IDeferredPaymentCreditProfile | null>(null);
	const [outstandingAmount, setOutstandingAmount] = useState<number | null>(null);
	const [isCreditProfileLoading, setIsCreditProfileLoading] = useState(false);
	const [creditProfileError, setCreditProfileError] = useState<string | null>(null);
	const [hasCreditProfileLoaded, setHasCreditProfileLoaded] = useState(false);
	const [isCreditProfileCreatorOpen, setIsCreditProfileCreatorOpen] = useState(false);
	const creditProfileRequestIdRef = useRef(0);
	const creditProfileAbortRef = useRef<AbortController | null>(null);
	const mode = deferredPaymentDocument ? 'edit' : 'create';
	const { formik, estimatedTotal, isSubmitting, isPaidEdit, actions } = useDeferredPaymentForm({
		mode,
		deferredPaymentDocument,
		paymentTermDays,
		isOpen,
		onSuccess: (savedDocument) => {
			onSaved?.(savedDocument);
			onClose();
		},
	});
	const { resetForm } = formik;

	const clearCreditProfile = useCallback(() => {
		creditProfileAbortRef.current?.abort();
		creditProfileAbortRef.current = null;
		creditProfileRequestIdRef.current += 1;
		setCreditProfile(null);
		setOutstandingAmount(null);
		setCreditProfileError(null);
		setHasCreditProfileLoaded(false);
		setIsCreditProfileLoading(false);
	}, []);

	const loadCreditProfile = useCallback(
		async (customerSaleId: number, allowEdit = false) => {
			if (subsidiaryId === null || (mode !== 'create' && !allowEdit)) return;
			creditProfileAbortRef.current?.abort();
			const controller = new AbortController();
			creditProfileAbortRef.current = controller;
			const requestId = creditProfileRequestIdRef.current + 1;
			creditProfileRequestIdRef.current = requestId;
			setIsCreditProfileLoading(true);
			setCreditProfileError(null);
			setHasCreditProfileLoaded(false);
			setCreditProfile(null);
			setOutstandingAmount(null);
			try {
				const profile = await deferredPaymentsService.getCreditProfile(
					subsidiaryId,
					customerSaleId,
					controller.signal,
				);
				const summary =
					profile.id !== null && profile.is_active && profile.credit_limit !== null
						? await deferredPaymentsService.getSummary(
								subsidiaryId,
								{ customer_sale_id: customerSaleId },
								controller.signal,
							)
						: null;
				if (requestId !== creditProfileRequestIdRef.current) return;
				const parsedOutstandingAmount =
					summary === null ? null : Number(summary.total_outstanding);
				if (parsedOutstandingAmount !== null && !Number.isFinite(parsedOutstandingAmount)) {
					throw new Error('No se pudo obtener el saldo pendiente del cliente');
				}
				setCreditProfile(profile);
				setOutstandingAmount(parsedOutstandingAmount);
				setHasCreditProfileLoaded(true);
				if (mode === 'create') {
					setPaymentTermDays(
						profile.id !== null && profile.is_active ? profile.payment_term_days : 30,
					);
				}
			} catch (error: unknown) {
				if (controller.signal.aborted || requestId !== creditProfileRequestIdRef.current)
					return;
				setCreditProfileError(
					getApiErrorMessage(error, 'No se pudo cargar el perfil de crédito del cliente'),
				);
			} finally {
				if (requestId === creditProfileRequestIdRef.current) {
					setIsCreditProfileLoading(false);
				}
			}
		},
		[mode, subsidiaryId],
	);

	useEffect(
		() => () => {
			creditProfileAbortRef.current?.abort();
			creditProfileRequestIdRef.current += 1;
		},
		[],
	);

	useEffect(() => {
		if (isOpen && mode === 'create') return;
		clearCreditProfile();
		if (!isOpen && mode === 'create') {
			setSelectedCustomerOption(null);
			setCustomerSearch('');
			setPaymentTermDays(30);
			resetForm();
		}
	}, [clearCreditProfile, isOpen, mode, resetForm]);

	useEffect(() => {
		if (!isOpen || mode !== 'edit' || deferredPaymentDocument === null) return;
		loadCreditProfile(deferredPaymentDocument.customer.id, true).catch(() => undefined);
	}, [deferredPaymentDocument, isOpen, loadCreditProfile, mode]);

	useEffect(() => {
		if (!isOpen || subsidiaryId === null) return undefined;
		const query = debouncedCustomerSearch.trim();
		const customerRequest = dispatch(
			fetchCustomersOverviewThunk({
				subsidiary: subsidiaryId,
				per_page: 100,
				params: query ? { q: query } : undefined,
			}),
		);
		return () => customerRequest.abort();
	}, [debouncedCustomerSearch, dispatch, isOpen, subsidiaryId]);

	useEffect(() => {
		if (!isOpen || subsidiaryId === null) return undefined;
		const usersRequest = dispatch(
			fetchUsers({ subsidiary_id: subsidiaryId, status: 'active', per_page: 100 }),
		);
		return () => usersRequest.abort();
	}, [dispatch, isOpen, subsidiaryId]);

	const customerData = useMemo<CustomerOptionData[]>(() => {
		const remoteCustomers = customers.map((customer) => ({
			id: customer.id,
			label: [customer.name, customer.rut]
				.filter((value): value is string => Boolean(value))
				.join(' · '),
			isActive: customer.is_active,
		}));
		const editedCustomer =
			mode === 'edit' && deferredPaymentDocument
				? {
						id: deferredPaymentDocument.customer.id,
						label: [
							deferredPaymentDocument.customer.billing_company ||
								deferredPaymentDocument.customer.contact_name,
							deferredPaymentDocument.customer.rut,
						]
							.filter(Boolean)
							.join(' · '),
						isActive: true,
					}
				: null;
		return Array.from(
			new Map(
				[
					...(editedCustomer ? [editedCustomer] : []),
					...remoteCustomers,
					...(selectedCustomerOption ? [selectedCustomerOption] : []),
				].map((customer) => [customer.id, customer]),
			).values(),
		);
	}, [customers, deferredPaymentDocument, mode, selectedCustomerOption]);
	const customerOptions = useMemo<TSelectOption[]>(
		() => customerData.map(({ id, label }) => ({ value: String(id), label })),
		[customerData],
	);
	const assigneeOptions = useMemo<TSelectOption[]>(() => {
		const remoteOptions = users
			.filter((user) => user.is_active)
			.map((user) => ({
				value: String(user.id),
				label:
					'name' in user && typeof user.name === 'string'
						? `${user.name} · ${user.email}`
						: `${user.first_name} ${user.last_name} · ${user.email}`,
			}));
		const editedOptions =
			mode === 'edit' && deferredPaymentDocument
				? deferredPaymentDocument.assignees.map((assignee) => ({
						value: String(assignee.id),
						label: `${assignee.name} · ${assignee.email}`,
					}))
				: [];
		return Array.from(
			new Map(
				[...editedOptions, ...remoteOptions].map((option) => [option.value, option]),
			).values(),
		);
	}, [deferredPaymentDocument, mode, users]);
	const selectedCustomer = customerData.find(
		(customer) => customer.id === formik.values.customer_sale_id,
	);
	const customerValue = customerOptions.find(
		(option) => option.value === String(formik.values.customer_sale_id ?? ''),
	);
	const assigneeValue = assigneeOptions.filter((option) =>
		formik.values.assignee_ids.includes(Number(option.value)),
	);
	const itemErrors = typeof formik.errors.items === 'string' ? formik.errors.items : undefined;
	const hasSelectedCustomer = formik.values.customer_sale_id !== null;
	const requiresCreditSummary =
		creditProfile?.id !== null &&
		creditProfile?.is_active === true &&
		creditProfile.credit_limit !== null;
	const isCreditProfileSuspended =
		mode === 'create' && creditProfile?.id !== null && creditProfile?.is_active === false;
	const isCreditProfileUnavailable =
		mode === 'create' &&
		hasSelectedCustomer &&
		(isCreditProfileLoading ||
			creditProfileError !== null ||
			(requiresCreditSummary && outstandingAmount === null));
	const exceedsCreditLimit =
		mode === 'create' &&
		hasSelectedCustomer &&
		!isCreditProfileLoading &&
		!creditProfileError &&
		outstandingAmount !== null &&
		isCreditProfileSuspended === false &&
		creditProfile !== null &&
		creditProfile.id !== null &&
		creditProfile.is_active &&
		creditProfile.credit_limit !== null &&
		outstandingAmount + estimatedTotal > Number(creditProfile.credit_limit);
	const isCreditProfileBlockingCreation =
		isCreditProfileSuspended || isCreditProfileUnavailable || exceedsCreditLimit;
	const hasCreatedCreditProfile = creditProfile !== null && creditProfile.id !== null;
	const shouldShowCreditProfileEmptyState =
		!hasCreatedCreditProfile &&
		!creditProfileError &&
		(hasCreditProfileLoaded || !hasSelectedCustomer);
	const creditProfileEmptyMessage = hasSelectedCustomer
		? 'Este cliente no tiene un perfil de crédito creado.'
		: 'Selecciona un cliente para consultar sus condiciones de crédito.';
	const creditProfileIcon = isCreditProfileLoading ? 'HeroArrowPath' : 'HeroInformationCircle';
	const creditProfileIconClassName = isCreditProfileLoading
		? 'animate-spin text-blue-600'
		: 'text-zinc-500';
	const creditLimit = creditProfile?.credit_limit ?? null;
	const creditLimitAmount = creditLimit === null ? null : Number(creditLimit);
	const availableCredit =
		creditLimitAmount === null || outstandingAmount === null
			? null
			: Math.max(creditLimitAmount - outstandingAmount, 0);
	const creditMetrics = [
		{
			label: 'Plazo',
			value: creditProfile ? `${creditProfile.payment_term_days} días` : '—',
			icon: 'HeroClock' as const,
			iconClassName: 'bg-blue-600',
		},
		{
			label: 'Cupo',
			value: creditLimitAmount === null ? '—' : formatCLP(creditLimitAmount),
			icon: 'HeroBanknotes' as const,
			iconClassName: 'bg-amber-600',
		},
		{
			label: 'Cupo usado',
			value:
				creditLimitAmount === null || outstandingAmount === null
					? '—'
					: formatCLP(outstandingAmount),
			icon: 'HeroChartBar' as const,
			iconClassName: 'bg-red-600',
		},
		{
			label: 'Cupo disponible',
			value:
				availableCredit === null || outstandingAmount === null
					? '—'
					: formatCLP(availableCredit),
			icon: 'HeroArrowTrendingUp' as const,
			iconClassName: 'bg-emerald-600',
		},
	];
	const handleClose = () => {
		if (!isSubmitting) {
			clearCreditProfile();
			onClose();
		}
	};
	const handleCloseCreditProfileCreator = () => {
		setIsCreditProfileCreatorOpen(false);
		if (formik.values.customer_sale_id !== null)
			loadCreditProfile(formik.values.customer_sale_id, true).catch(() => undefined);
	};
	const handleRetryCreditProfile = () => {
		const customerSaleId = formik.values.customer_sale_id;
		if (customerSaleId !== null)
			loadCreditProfile(customerSaleId, mode === 'edit').catch(() => undefined);
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='2xl' isScrollable isStaticBackdrop>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
						{mode === 'create' ? 'Nuevo documento' : 'Editar documento'}
					</h2>
					<p className='text-sm font-normal text-zinc-500'>
						Registra la deuda y define quién realizará su seguimiento.
					</p>
				</div>
			</ModalHeader>
			<FormikProvider value={formik}>
				<Form
					className='flex min-h-0 flex-1 flex-col overflow-hidden'
					onSubmit={(event) => {
						event.preventDefault();
						formik
							.validateForm()
							.then((errors) => {
								if (
									estimatedTotal <= 0 &&
									!hasValidationErrorOtherThan(
										errors,
										DEFERRED_PAYMENT_TOTAL_ERROR,
									)
								)
									toast.error(DEFERRED_PAYMENT_TOTAL_ERROR);
								if (!isCreditProfileBlockingCreation) return formik.submitForm();
								return undefined;
							})
							.catch(() => undefined);
					}}>
					<ModalBody className='min-h-0 flex-1 space-y-5 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
						{isPaidEdit && (
							<Alert color='amber' variant='outline' icon='HeroLockClosed'>
								Los documentos pagados no se pueden editar.
							</Alert>
						)}

						{selectedCustomer && !selectedCustomer.isActive && (
							<Alert color='amber' variant='outline' icon='HeroUserMinus'>
								Este cliente está suspendido. Confirma su situación antes de
								guardar.
							</Alert>
						)}

						{isCreditProfileSuspended && (
							<Alert color='red' variant='outline' icon='HeroLockClosed'>
								El crédito de este cliente está suspendido. Reactívalo antes de
								crear un documento de pago diferido.
							</Alert>
						)}

						{exceedsCreditLimit && creditProfile?.credit_limit && (
							<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
								El total estimado del documento ({formatCLP(estimatedTotal)}) más el
								saldo pendiente del cliente ({formatCLP(outstandingAmount)}) supera
								el cupo de crédito disponible (
								{formatCLP(creditProfile.credit_limit)}). Reduce el monto o aumenta
								el cupo antes de continuar.
							</Alert>
						)}

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>Datos del documento</CardTitle>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3'>
								<DeferredPaymentField
									name='customer_sale_id'
									label='Cliente'
									className='md:col-span-2 lg:col-span-1'>
									{({ error, isTouched, isValid }) => (
										<SelectReact
											name='customer_sale_id'
											inputId='customer_sale_id'
											options={customerOptions}
											value={customerValue ?? null}
											isLoading={customersLoading}
											isDisabled={isPaidEdit}
											placeholder='Busca por razón social o RUT'
											noOptionsMessage={() => 'Sin resultados'}
											onInputChange={(
												value: string,
												actionMeta?: InputActionMeta,
											) => {
												if (actionMeta?.action === 'input-change')
													setCustomerSearch(value);
											}}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={(value) => {
												const option = isSelectOption(value) ? value : null;
												const customer = customerData.find(
													(entry) => entry.id === Number(option?.value),
												);
												setSelectedCustomerOption(customer ?? null);
												if (mode === 'create') {
													setPaymentTermDays(30);
													if (customer)
														loadCreditProfile(customer.id).catch(
															() => undefined,
														);
													else clearCreditProfile();
												}
												formik
													.setFieldValue(
														'customer_sale_id',
														customer?.id ?? null,
													)
													.catch(() => undefined);
											}}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='document_type' label='Tipo'>
									{({ error, isTouched, isValid }) => (
										<SelectReact
											name='document_type'
											inputId='document_type'
											options={documentTypeOptions}
											value={
												documentTypeOptions.find(
													(option) =>
														option.value ===
														formik.values.document_type,
												) ?? null
											}
											isDisabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={(value) => {
												if (isSelectOption(value))
													formik
														.setFieldValue('document_type', value.value)
														.catch(() => undefined);
											}}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField
									name='document_number'
									label='Número de documento'>
									{({ error, isTouched, isValid }) => (
										<Input
											id='document_number'
											name='document_number'
											placeholder='Ej.: FAC-001234'
											value={formik.values.document_number}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='issue_date' label='Fecha de emisión'>
									{({ error, isTouched, isValid }) => (
										<DateInput
											id='issue_date'
											name='issue_date'
											value={formik.values.issue_date}
											maxDate={MAX_DATE}
											maxYear={MAX_YEAR}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={formik.handleChange}
											onBlur={() =>
												formik.setFieldTouched('issue_date', true)
											}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='due_date' label='Fecha de vencimiento'>
									{({ error, isTouched, isValid }) => (
										<DateInput
											id='due_date'
											name='due_date'
											value={formik.values.due_date}
											maxDate={MAX_DATE}
											maxYear={MAX_YEAR}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={(event) =>
												actions
													.setDueDateManually(event.target.value)
													.catch(() => undefined)
											}
											onBlur={() => formik.setFieldTouched('due_date', true)}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField
									name='purchase_order'
									label='Orden de compra (opcional)'>
									{({ error, isTouched, isValid }) => (
										<Input
											id='purchase_order'
											name='purchase_order'
											placeholder='Ej.: OC-12345'
											value={formik.values.purchase_order ?? ''}
											maxLength={100}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
										/>
									)}
								</DeferredPaymentField>
								<div>
									<Label htmlFor='assignee_ids'>Responsables</Label>
									<SelectReact
										name='assignee_ids'
										inputId='assignee_ids'
										isMulti
										options={assigneeOptions}
										value={assigneeValue}
										isLoading={usersLoading}
										isDisabled={isPaidEdit}
										placeholder='Selecciona responsables'
										onChange={(value) =>
											formik
												.setFieldValue(
													'assignee_ids',
													asMultiOptions(value).map((option) =>
														Number(option.value),
													),
												)
												.catch(() => undefined)
										}
									/>
								</div>
								<DeferredPaymentField
									name='notes'
									label='Notas (opcional)'
									className='md:col-span-2 lg:col-span-3'>
									{({ error, isTouched, isValid }) => (
										<Textarea
											id='notes'
											name='notes'
											rows={3}
											color='zinc'
											colorIntensity='300'
											className='bg-zinc-50 dark:bg-zinc-900'
											value={formik.values.notes ?? ''}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
										/>
									)}
								</DeferredPaymentField>
							</CardBody>
						</Card>

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>Información de crédito</CardTitle>
							</CardHeader>
							<CardBody>
								{hasCreatedCreditProfile && (
									<div
										className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
										aria-live='polite'>
										{creditMetrics.map((metric) => (
											<div
												key={metric.label}
												className='flex min-w-0 items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950'>
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${metric.iconClassName}`}>
													<Icon
														icon={metric.icon}
														size='text-xl'
														color='white'
													/>
												</div>
												<div className='min-w-0'>
													<p className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
														{metric.label}
													</p>
													<p className='truncate text-lg font-bold tabular-nums text-zinc-900 dark:text-white'>
														{metric.value}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
								{!hasCreatedCreditProfile && creditProfileError && (
									<Alert
										color='red'
										variant='outline'
										icon='HeroExclamationTriangle'>
										<div className='space-y-3'>
											<p>{creditProfileError}</p>
											{formik.values.customer_sale_id !== null && (
												<Button
													variant='outline'
													color='red'
													type='button'
													onClick={handleRetryCreditProfile}>
													Reintentar
												</Button>
											)}
										</div>
									</Alert>
								)}
								{shouldShowCreditProfileEmptyState && (
									<div className='flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
										<Icon
											icon={creditProfileIcon}
											size='text-2xl'
											className={creditProfileIconClassName}
										/>
										<p aria-live='polite'>{creditProfileEmptyMessage}</p>
										{hasSelectedCustomer && !isCreditProfileLoading && (
											<ProtectedButton
												permission={
													ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE
												}
												subsidiaryId={subsidiaryId}
												scope='access'
												type='button'
												variant='outline'
												icon='HeroPlus'
												onClick={() => setIsCreditProfileCreatorOpen(true)}>
												Crear perfil
											</ProtectedButton>
										)}
									</div>
								)}
							</CardBody>
						</Card>

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>Ítems del documento</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								<FieldArray name='items'>
									{(arrayHelpers) => (
										<>
											{formik.values.items.map((item, index) => (
												<div
													key={item.client_key}
													className='grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 md:grid-cols-12'>
													<DeferredPaymentField
														name={`items.${index}.code`}
														label='Código'
														className='md:col-span-2'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.code`}
																name={`items.${index}.code`}
																placeholder='Ej.: PROD-001'
																value={item.code}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<DeferredPaymentField
														name={`items.${index}.description`}
														label='Descripción'
														className='md:col-span-5'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.description`}
																name={`items.${index}.description`}
																placeholder='Describe el producto o servicio'
																value={item.description}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<DeferredPaymentField
														name={`items.${index}.quantity`}
														label='Cantidad'
														className='md:col-span-2'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.quantity`}
																name={`items.${index}.quantity`}
																type='number'
																min={1}
																value={item.quantity}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<DeferredPaymentField
														name={`items.${index}.unit_price`}
														hiddenErrorMessage={
															DEFERRED_PAYMENT_TOTAL_ERROR
														}
														label='Precio unitario'
														className='md:col-span-2'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.unit_price`}
																name={`items.${index}.unit_price`}
																type='number'
																min={0}
																value={item.unit_price}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<div className='flex items-start pt-7 md:col-span-1'>
														<Button
															type='button'
															variant='outline'
															color='red'
															icon='HeroTrash'
															aria-label={`Quitar ítem ${index + 1}`}
															isDisable={
																isPaidEdit ||
																formik.values.items.length === 1
															}
															onClick={() =>
																arrayHelpers.remove(index)
															}
														/>
													</div>
													<DeferredPaymentField
														name={`items.${index}.serials`}
														className='md:col-span-12'>
														{() => (
															<DeferredPaymentSerialsInput
																id={`items.${index}.serials`}
																value={item.serials}
																disabled={isPaidEdit}
																onChange={(serials) =>
																	formik
																		.setFieldValue(
																			`items.${index}.serials`,
																			serials,
																		)
																		.catch(() => undefined)
																}
															/>
														)}
													</DeferredPaymentField>
												</div>
											))}
											<Button
												type='button'
												variant='outline'
												icon='HeroPlus'
												isDisable={isPaidEdit}
												onClick={() =>
													arrayHelpers.push(
														createEmptyDeferredPaymentItem(),
													)
												}>
												Agregar ítem
											</Button>
										</>
									)}
								</FieldArray>
								{itemErrors && <p className='text-sm text-red-600'>{itemErrors}</p>}
								<div className='flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-700'>
									<div className='text-right'>
										<p className='text-sm text-zinc-500'>Total estimado</p>
										<p className='text-2xl font-bold'>
											{formatCLP(estimatedTotal)}
										</p>
									</div>
								</div>
							</CardBody>
						</Card>
					</ModalBody>
					<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-800 dark:bg-zinc-950'>
						<ModalFooterChild>
							<Button
								type='button'
								variant='outline'
								isDisable={isSubmitting}
								onClick={handleClose}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button
								type='submit'
								variant='solid'
								color='blue'
								icon='HeroCheck'
								isLoading={isSubmitting}
								isDisable={
									isSubmitting || isPaidEdit || isCreditProfileBlockingCreation
								}>
								{mode === 'create' ? 'Crear documento' : 'Guardar cambios'}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Form>
			</FormikProvider>
			<Modal
				isOpen={isCreditProfileCreatorOpen}
				setIsOpen={handleCloseCreditProfileCreator}
				size='lg'
				isStaticBackdrop>
				<ModalHeader>Crear perfil de crédito</ModalHeader>
				<ModalBody>
					{formik.values.customer_sale_id !== null && (
						<CustomerCreditProfileCard
							customerSaleId={formik.values.customer_sale_id}
						/>
					)}
				</ModalBody>
			</Modal>
		</Modal>
	);
};

export default CreateEditDeferredPaymentModal;
