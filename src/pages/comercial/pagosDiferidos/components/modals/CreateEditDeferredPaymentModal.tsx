import React, { useEffect, useMemo, useState } from 'react';
import { FieldArray, Form, FormikProvider } from 'formik';
import type { InputActionMeta } from 'react-select';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
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
import DeferredPaymentField from '../parts/DeferredPaymentField';
import DeferredPaymentSerialsInput from '../parts/DeferredPaymentSerialsInput';
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
	paymentTermDays: number;
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
	const mode = deferredPaymentDocument ? 'edit' : 'create';
	const { formik, estimatedTotal, isSubmitting, isPaidEdit, actions } = useDeferredPaymentForm({
		mode,
		deferredPaymentDocument,
		paymentTermDays,
		onSuccess: (savedDocument) => {
			onSaved?.(savedDocument);
			onClose();
		},
	});

	useEffect(() => {
		if (!isOpen || subsidiaryId === null) return undefined;
		const customerRequest = dispatch(
			fetchCustomersOverviewThunk({
				subsidiary: subsidiaryId,
				per_page: 100,
				params: { q: debouncedCustomerSearch.trim() || undefined },
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
			paymentTermDays: 30,
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
						paymentTermDays: 30,
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
	const handleClose = () => {
		if (!isSubmitting) onClose();
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
								return formik.submitForm();
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

						<Card>
							<CardHeader>
								<CardTitle>Datos del documento</CardTitle>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<DeferredPaymentField
									name='customer_sale_id'
									label='Cliente'
									className='md:col-span-2'>
									{({ error, isTouched, isValid }) => (
										<SelectReact
											name='customer_sale_id'
											inputId='customer_sale_id'
											options={customerOptions}
											value={customerValue ?? null}
											isLoading={customersLoading}
											isDisabled={isPaidEdit}
											placeholder='Busca por razón social o RUT'
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
												setPaymentTermDays(customer?.paymentTermDays ?? 30);
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
									className='md:col-span-2'>
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

						<Card>
							<CardHeader>
								<CardTitle>Ítems del documento</CardTitle>
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
								isDisable={isSubmitting || isPaidEdit}>
								{mode === 'create' ? 'Crear documento' : 'Guardar cambios'}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Form>
			</FormikProvider>
		</Modal>
	);
};

export default CreateEditDeferredPaymentModal;
