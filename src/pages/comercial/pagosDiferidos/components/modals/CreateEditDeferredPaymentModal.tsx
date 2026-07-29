import React, { useEffect, useMemo, useState } from 'react';
import { FieldArray, Form, FormikProvider, getIn } from 'formik';
import type { IDeferredPaymentDocument } from '@/interface/deferredPayments.interface';
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
import { fetchCustomersThunk } from '@/store/slices/customerSales/customerSalesSlice';
import USE_DEFERRED_PAYMENTS_MOCK from '@/store/slices/deferredPayments/deferredPaymentsConfig';
import { DEFERRED_PAYMENT_DETAILS_MOCK } from '@/store/slices/deferredPayments/deferredPaymentsMock';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
import { formatCLP } from '@/utils/format.utils';
import useDeferredPaymentForm from '../../hooks/useDeferredPaymentForm';
import { createEmptyDeferredPaymentItem } from '../../types';
import { DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS } from '../../utils';

interface CreateEditDeferredPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	document?: IDeferredPaymentDocument | null;
	onSaved?: (document: IDeferredPaymentDocument) => void;
}

interface CustomerOptionData {
	id: number;
	label: string;
	isActive: boolean;
	paymentTermDays: number;
	creditLimit: number | null;
}

const MAX_DATE = new Date(2100, 11, 31);
const MAX_YEAR = 2100;
const DEFAULT_CREDIT_LIMIT = 2_000_000;
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

const fieldError = (errors: unknown, touched: unknown, name: string): string | undefined => {
	const error = getIn(errors, name) as unknown;
	return getIn(touched, name) && typeof error === 'string' ? error : undefined;
};

const CreateEditDeferredPaymentModal: React.FC<CreateEditDeferredPaymentModalProps> = ({
	isOpen,
	onClose,
	document = null,
	onSaved,
}) => {
	const dispatch = useAppDispatch();
	const customers = useAppSelector((state) => state.customerSales.lista);
	const customersLoading = useAppSelector((state) => state.customerSales.loading);
	const users = useAppSelector((state) => state.usersAdmin.users);
	const usersLoading = useAppSelector((state) => state.usersAdmin.loading.users);
	const listSubsidiaryId = useAppSelector((state) => state.deferredPayments.listSubsidiaryId);
	const [paymentTermDays, setPaymentTermDays] = useState(30);
	const mode = document ? 'edit' : 'create';
	const { formik, estimatedTotal, isSubmitting, isPaidEdit, error, creditLimitExceeded } =
		useDeferredPaymentForm({
			mode,
			document,
			paymentTermDays,
			onSuccess: (savedDocument) => {
				onSaved?.(savedDocument);
				onClose();
			},
		});

	useEffect(() => {
		if (!isOpen || USE_DEFERRED_PAYMENTS_MOCK || listSubsidiaryId === null) return undefined;
		const customerRequest = dispatch(fetchCustomersThunk({ subsidiary: listSubsidiaryId }));
		const usersRequest = dispatch(
			fetchUsers({ subsidiary_id: listSubsidiaryId, status: 'active', per_page: 100 }),
		);
		return () => {
			customerRequest.abort();
			usersRequest.abort();
		};
	}, [dispatch, isOpen, listSubsidiaryId]);

	const customerData = useMemo<CustomerOptionData[]>(() => {
		if (USE_DEFERRED_PAYMENTS_MOCK) {
			return Object.values(DEFERRED_PAYMENT_DETAILS_MOCK).map((mockDocument) => ({
				id: mockDocument.customer.id,
				label: `${mockDocument.customer.billing_company} · ${mockDocument.customer.rut}`,
				isActive: mockDocument.customer.id !== 3,
				paymentTermDays: 30,
				creditLimit: DEFAULT_CREDIT_LIMIT,
			}));
		}
		return customers.map((customer) => ({
			id: customer.id,
			label: `${customer.billing_company || customer.name} · ${customer.rut}`,
			isActive: customer.is_active,
			paymentTermDays: 30,
			creditLimit: null,
		}));
	}, [customers]);
	const customerOptions = useMemo<TSelectOption[]>(
		() => customerData.map(({ id, label }) => ({ value: String(id), label })),
		[customerData],
	);
	const mockAssignees = useMemo(
		() =>
			Array.from(
				new Map(
					Object.values(DEFERRED_PAYMENT_DETAILS_MOCK)
						.flatMap((mockDocument) => mockDocument.assignees)
						.map((assignee) => [assignee.id, assignee]),
				).values(),
			),
		[],
	);
	const assigneeOptions = useMemo<TSelectOption[]>(
		() =>
			(USE_DEFERRED_PAYMENTS_MOCK
				? mockAssignees
				: users.filter((user) => user.is_active)
			).map((user) => ({
				value: String(user.id),
				label:
					'name' in user
						? `${user.name} · ${user.email}`
						: `${user.first_name} ${user.last_name} · ${user.email}`,
			})),
		[mockAssignees, users],
	);
	const selectedCustomer = customerData.find(
		(customer) => customer.id === formik.values.customer_sale_id,
	);
	const customerValue = customerOptions.find(
		(option) => option.value === String(formik.values.customer_sale_id ?? ''),
	);
	const assigneeValue = assigneeOptions.filter((option) =>
		formik.values.assignee_ids.includes(Number(option.value)),
	);
	const exceedsKnownCreditLimit = Boolean(
		selectedCustomer?.creditLimit !== null &&
			selectedCustomer?.creditLimit !== undefined &&
			estimatedTotal > selectedCustomer.creditLimit,
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
				<Form className='flex min-h-0 flex-1 flex-col overflow-hidden'>
					<ModalBody className='min-h-0 flex-1 space-y-5 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
						{isPaidEdit && (
							<Alert color='amber' variant='outline' icon='HeroLockClosed'>
								Los documentos pagados no se pueden editar.
							</Alert>
						)}
						{error && (
							<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
								{error}
							</Alert>
						)}
						{(exceedsKnownCreditLimit || creditLimitExceeded) && (
							<Alert color='amber' variant='outline' icon='HeroExclamationTriangle'>
								El total supera el límite de crédito conocido del cliente. Puedes
								guardar, pero conviene revisar la condición comercial.
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
								<div className='md:col-span-2'>
									<Label htmlFor='customer_sale_id'>Cliente</Label>
									<SelectReact
										name='customer_sale_id'
										inputId='customer_sale_id'
										options={customerOptions}
										value={customerValue ?? null}
										isLoading={!USE_DEFERRED_PAYMENTS_MOCK && customersLoading}
										isDisabled={isPaidEdit}
										placeholder='Busca por razón social o RUT'
										onChange={(value) => {
											const option = isSelectOption(value) ? value : null;
											const customer = customerData.find(
												(entry) => entry.id === Number(option?.value),
											);
											setPaymentTermDays(customer?.paymentTermDays ?? 30);
											formik
												.setFieldValue(
													'customer_sale_id',
													customer?.id ?? null,
												)
												.catch(() => undefined);
										}}
									/>
									{fieldError(
										formik.errors,
										formik.touched,
										'customer_sale_id',
									) && (
										<p className='mt-1 text-sm text-red-600'>
											{fieldError(
												formik.errors,
												formik.touched,
												'customer_sale_id',
											)}
										</p>
									)}
								</div>
								<div>
									<Label htmlFor='document_type'>Tipo</Label>
									<SelectReact
										name='document_type'
										inputId='document_type'
										options={documentTypeOptions}
										value={
											documentTypeOptions.find(
												(option) =>
													option.value === formik.values.document_type,
											) ?? null
										}
										isDisabled={isPaidEdit}
										onChange={(value) => {
											if (isSelectOption(value))
												formik
													.setFieldValue('document_type', value.value)
													.catch(() => undefined);
										}}
									/>
								</div>
								<Input
									name='document_number'
									label='Número de documento'
									value={formik.values.document_number}
									onChange={(event) => formik.handleChange(event)}
									onBlur={(event) => formik.handleBlur(event)}
									disabled={isPaidEdit}
									isValid={formik.isValid}
									isTouched={Boolean(formik.touched.document_number)}
									invalidFeedback={fieldError(
										formik.errors,
										formik.touched,
										'document_number',
									)}
								/>
								<div>
									<Label htmlFor='issue_date'>Fecha de emisión</Label>
									<DateInput
										id='issue_date'
										name='issue_date'
										value={formik.values.issue_date}
										maxDate={MAX_DATE}
										maxYear={MAX_YEAR}
										disabled={isPaidEdit}
										onChange={(event) => formik.handleChange(event)}
										onBlur={(event) => formik.handleBlur(event)}
									/>
									{fieldError(formik.errors, formik.touched, 'issue_date') && (
										<p className='mt-1 text-sm text-red-600'>
											{fieldError(
												formik.errors,
												formik.touched,
												'issue_date',
											)}
										</p>
									)}
								</div>
								<div>
									<Label htmlFor='due_date'>Fecha de vencimiento</Label>
									<DateInput
										id='due_date'
										name='due_date'
										value={formik.values.due_date}
										maxDate={MAX_DATE}
										maxYear={MAX_YEAR}
										disabled={isPaidEdit}
										onChange={(event) => formik.handleChange(event)}
										onBlur={(event) => formik.handleBlur(event)}
									/>
									{fieldError(formik.errors, formik.touched, 'due_date') && (
										<p className='mt-1 text-sm text-red-600'>
											{fieldError(formik.errors, formik.touched, 'due_date')}
										</p>
									)}
								</div>
								<Input
									name='purchase_order'
									label='Orden de compra (opcional)'
									value={formik.values.purchase_order ?? ''}
									onChange={(event) => formik.handleChange(event)}
									onBlur={(event) => formik.handleBlur(event)}
									disabled={isPaidEdit}
								/>
								<div>
									<Label htmlFor='assignee_ids'>Responsables</Label>
									<SelectReact
										name='assignee_ids'
										inputId='assignee_ids'
										isMulti
										options={assigneeOptions}
										value={assigneeValue}
										isLoading={!USE_DEFERRED_PAYMENTS_MOCK && usersLoading}
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
								<div className='md:col-span-2'>
									<Label htmlFor='notes'>Notas (opcional)</Label>
									<Textarea
										id='notes'
										name='notes'
										rows={3}
										value={formik.values.notes ?? ''}
										onChange={(event) => formik.handleChange(event)}
										onBlur={(event) => formik.handleBlur(event)}
										disabled={isPaidEdit}
									/>
								</div>
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
													<div className='md:col-span-2'>
														<Input
															name={`items.${index}.code`}
															label='Código'
															value={item.code}
															onChange={(event) =>
																formik.handleChange(event)
															}
															onBlur={(event) =>
																formik.handleBlur(event)
															}
															disabled={isPaidEdit}
															invalidFeedback={fieldError(
																formik.errors,
																formik.touched,
																`items.${index}.code`,
															)}
															isTouched={Boolean(
																getIn(
																	formik.touched,
																	`items.${index}.code`,
																),
															)}
															isValid={formik.isValid}
														/>
													</div>
													<div className='md:col-span-5'>
														<Input
															name={`items.${index}.description`}
															label='Descripción'
															value={item.description}
															onChange={(event) =>
																formik.handleChange(event)
															}
															onBlur={(event) =>
																formik.handleBlur(event)
															}
															disabled={isPaidEdit}
															invalidFeedback={fieldError(
																formik.errors,
																formik.touched,
																`items.${index}.description`,
															)}
															isTouched={Boolean(
																getIn(
																	formik.touched,
																	`items.${index}.description`,
																),
															)}
															isValid={formik.isValid}
														/>
													</div>
													<div className='md:col-span-2'>
														<Input
															name={`items.${index}.quantity`}
															label='Cantidad'
															type='number'
															min={1}
															value={item.quantity}
															onChange={(event) =>
																formik.handleChange(event)
															}
															onBlur={(event) =>
																formik.handleBlur(event)
															}
															disabled={isPaidEdit}
														/>
													</div>
													<div className='md:col-span-2'>
														<Input
															name={`items.${index}.unit_price`}
															label='Precio unitario'
															type='number'
															min={0}
															value={item.unit_price}
															onChange={(event) =>
																formik.handleChange(event)
															}
															onBlur={(event) =>
																formik.handleBlur(event)
															}
															disabled={isPaidEdit}
														/>
													</div>
													<div className='flex items-end md:col-span-1'>
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
