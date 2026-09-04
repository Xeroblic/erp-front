import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';

import { useAppDispatch } from '@/store';
import {
	createCustomerThunk,
	updateCustomerThunk,
	fetchCustomerDetailThunk,
	fetchCustomersOverviewThunk,
	type CustomerSaleRequestError,
} from '@/store/slices/customerSales/customerSalesSlice';
import { ICustomerSale } from '@/interface/customerSales.interface';
import { formatRut, validateRut } from '../../../../../utils/validateRut';

interface CustomerSaleFormValues {
	document_number: string;
	billing_company: string;
	contact_name: string;
	email: string;
	phone: string;
	is_active: boolean;
}

/**
 * Los errores por campo de Laravel usan los nombres del payload, que no siempre
 * coinciden con los del formulario (`rut` → `document_number`).
 */
const FORM_FIELD_BY_API_FIELD: Record<string, keyof CustomerSaleFormValues> = {
	document_number: 'document_number',
	rut: 'document_number',
	billing_company: 'billing_company',
	contact_name: 'contact_name',
	primary_contact_name: 'contact_name',
	email: 'email',
	primary_contact_email: 'email',
	phone: 'phone',
	primary_contact_phone: 'phone',
	is_active: 'is_active',
};

const isRequestError = (error: unknown): error is CustomerSaleRequestError =>
	error !== null &&
	typeof error === 'object' &&
	typeof (error as { message?: unknown }).message === 'string';

interface PrimaryContactPayload {
	primary_contact: { name: string; email: string; phone: string };
	primary_contact_name: string;
	primary_contact_email: string;
	primary_contact_phone: string;
}

/**
 * El backend exige el trío completo si llega cualquiera de sus campos, así que el grupo
 * viaja entero o no viaja: enviarlo incompleto convierte el mínimo que el formulario da
 * por válido (RUT + empresa + email) en un `422 Contacto principal incompleto`.
 */
const buildPrimaryContactPayload = (
	values: CustomerSaleFormValues,
): PrimaryContactPayload | Record<string, never> => {
	const name = values.contact_name.trim();
	const email = values.email.trim();
	const phone = values.phone.trim();
	if (!name || !email || !phone) return {};
	return {
		primary_contact: { name, email, phone },
		primary_contact_name: name,
		primary_contact_email: email,
		primary_contact_phone: phone,
	};
};

/** Identidad de una mutación en vuelo: si cambia, la respuesta ya no tiene dueño. */
interface CustomerMutationContext {
	requestId: number;
	subsidiaryId: number | string;
	customerId: number | string | null;
}

const CreateCustomerSaleModal = ({
	isOpen,
	setIsOpen,
	subsidiaryId,
	isEdit = false,
	initialData,
	onSuccess,
	refreshStoreOnSuccess = true,
}: {
	isOpen: boolean;
	setIsOpen: (v: boolean) => void;
	subsidiaryId: number | string | null | undefined;
	isEdit?: boolean;
	initialData?: Partial<ICustomerSale> | null;
	onSuccess?: (customer: ICustomerSale) => void;
	/**
	 * Refresca detalle y overview en el store al guardar. Desactívalo cuando el
	 * consumidor ya administra esa lista (p. ej. la búsqueda del modal de pago
	 * diferido, que la carga con sus propios `per_page` y `q`) y un refetch con
	 * los parámetros por defecto se la sobrescribiría.
	 */
	refreshStoreOnSuccess?: boolean;
}) => {
	const dispatch = useAppDispatch();
	const rutId = React.useId();
	const companyId = React.useId();
	const contactId = React.useId();
	const emailId = React.useId();
	const phoneId = React.useId();
	const requestIdRef = React.useRef(0);
	const latestSubsidiaryIdRef = React.useRef(subsidiaryId);
	const latestCustomerIdRef = React.useRef(initialData?.id ?? null);
	const latestIsOpenRef = React.useRef(isOpen);
	latestSubsidiaryIdRef.current = subsidiaryId;
	latestCustomerIdRef.current = initialData?.id ?? null;
	latestIsOpenRef.current = isOpen;

	React.useEffect(
		() => () => {
			latestIsOpenRef.current = false;
			requestIdRef.current += 1;
		},
		[],
	);

	/**
	 * Una respuesta obsoleta —el usuario cambió de subsidiaria o cerró el modal mientras
	 * la mutación viajaba— no puede seleccionar ni pintar el cliente creado: pertenecería
	 * a otra subsidiaria que la del contexto actual.
	 */
	const isCurrentMutation = React.useCallback(
		({ requestId, subsidiaryId: mutationSubsidiaryId, customerId }: CustomerMutationContext) =>
			requestId === requestIdRef.current &&
			latestSubsidiaryIdRef.current === mutationSubsidiaryId &&
			latestCustomerIdRef.current === customerId &&
			latestIsOpenRef.current,
		[],
	);

	const formik = useFormik<CustomerSaleFormValues>({
		initialValues: {
			document_number: initialData?.document_number ?? initialData?.rut ?? '',
			billing_company: initialData?.billing_company ?? '',
			contact_name: initialData?.contact_name ?? initialData?.primary_contact?.name ?? '',
			email: initialData?.email ?? '',
			phone: initialData?.phone ?? '',
			is_active: typeof initialData?.is_active === 'boolean' ? initialData.is_active : true,
		},
		enableReinitialize: true,
		validationSchema: Yup.object({
			document_number: Yup.string()
				.required('RUT requerido')
				.test('rut-valid', 'RUT inválido', (value) => validateRut(value || '')),
			email: Yup.string().email('Email inválido').required('Email requerido'),
			/**
			 * El backend acepta `billing_company` nula al crear y al editar
			 * (`sometimes|nullable`), así que exigirla aquí bloqueaba editar cualquier
			 * cliente que se haya guardado sin empresa.
			 */
			billing_company: Yup.string().max(255, 'Máximo 255 caracteres'),
		}),
		onSubmit: async (values, { setSubmitting, setFieldError }) => {
			if (!subsidiaryId) {
				toast.error('No se pudo determinar la subsidiaria activa');
				setSubmitting(false);
				return;
			}

			const customerId = isEdit ? (initialData?.id ?? null) : null;
			requestIdRef.current += 1;
			const mutation: CustomerMutationContext = {
				requestId: requestIdRef.current,
				subsidiaryId,
				customerId,
			};
			const primaryContact = buildPrimaryContactPayload(values);

			try {
				if (isEdit && customerId !== null) {
					const customer = await dispatch(
						updateCustomerThunk({
							subsidiary: subsidiaryId,
							id: customerId,
							payload: {
								// `document_number`, no `rut`: la unicidad por subsidiaria del
								// backend sólo se valida sobre este campo.
								document_number: values.document_number,
								billing_company: values.billing_company,
								contact_name: values.contact_name,
								email: values.email,
								phone: values.phone,
								is_active: values.is_active,
								...primaryContact,
							},
						}),
					).unwrap();

					if (!isCurrentMutation(mutation)) return;

					// refrescar detalle y overview
					if (refreshStoreOnSuccess) {
						dispatch(
							fetchCustomerDetailThunk({
								subsidiary: subsidiaryId,
								id: customerId,
							}),
						).catch(() => undefined);
						dispatch(fetchCustomersOverviewThunk({ subsidiary: subsidiaryId })).catch(
							() => undefined,
						);
					}
					onSuccess?.(customer);
					setIsOpen(false);
				} else {
					const customer = await dispatch(
						createCustomerThunk({
							subsidiary: subsidiaryId,
							payload: {
								document_type: 'rut',
								rut: values.document_number,
								billing_company: values.billing_company,
								contact_name: values.contact_name,
								email: values.email,
								phone: values.phone,
								is_active: values.is_active,
								...primaryContact,
							},
						}),
					).unwrap();

					if (!isCurrentMutation(mutation)) return;

					if (refreshStoreOnSuccess)
						dispatch(fetchCustomersOverviewThunk({ subsidiary: subsidiaryId })).catch(
							() => undefined,
						);
					onSuccess?.(customer);
					setIsOpen(false);
					formik.resetForm();
				}
			} catch (error) {
				// El borrador se conserva: sólo se pinta el error si la mutación sigue siendo
				// la del contexto actual; si no, el formulario ya pertenece a otra subsidiaria.
				if (!isCurrentMutation(mutation)) return;
				const fallback = isEdit
					? 'No se pudo actualizar el cliente'
					: 'No se pudo crear el cliente';
				const requestError = isRequestError(error) ? error : null;
				// Un 422 de Laravel trae el detalle por campo: lo pintamos sobre el input
				// correspondiente además del toast, para que el usuario sepa qué corregir.
				Object.entries(requestError?.errors ?? {}).forEach(([apiField, messages]) => {
					const formField = FORM_FIELD_BY_API_FIELD[apiField];
					if (formField && messages[0]) setFieldError(formField, messages[0]);
				});
				toast.error(requestError?.message ?? fallback);
			} finally {
				setSubmitting(false);
			}
		},
	});

	// Cerrar con una mutación en vuelo dejaría la respuesta sin dueño: el modal se
	// mantiene abierto hasta que resuelve y el usuario ve el spinner del botón.
	const closeIfIdle = () => {
		if (formik.isSubmitting) return;
		setIsOpen(false);
		formik.resetForm();
	};

	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={closeIfIdle}
			size='md'
			isStaticBackdrop={formik.isSubmitting}>
			<ModalHeader>{isEdit ? 'Editar Cliente' : 'Crear Cliente'}</ModalHeader>

			<ModalBody>
				<form onSubmit={formik.handleSubmit} className='space-y-4'>
					<div className='space-y-1'>
						<Label htmlFor={rutId}>RUT</Label>
						<Input
							id={rutId}
							name='document_number'
							placeholder='12345678-9'
							value={formik.values.document_number}
							onChange={(e) => {
								const formatted = formatRut(e.target.value);
								formik
									.setFieldValue('document_number', formatted)
									.catch(() => undefined);
							}}
							onBlur={formik.handleBlur}
							isTouched={!!formik.touched.document_number}
							isValid={!formik.errors.document_number}
							invalidFeedback={
								formik.touched.document_number
									? formik.errors.document_number
									: undefined
							}
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-1'>
							<Label htmlFor={companyId}>Empresa (opcional)</Label>
							<Input
								id={companyId}
								name='billing_company'
								placeholder='Empresa S.A.'
								value={formik.values.billing_company}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								isTouched={!!formik.touched.billing_company}
								isValid={!formik.errors.billing_company}
								invalidFeedback={
									formik.touched.billing_company
										? formik.errors.billing_company
										: undefined
								}
							/>
						</div>
						<div className='space-y-1'>
							<Label htmlFor={contactId}>Contacto</Label>
							<Input
								id={contactId}
								name='contact_name'
								placeholder='Juan Pérez'
								value={formik.values.contact_name}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
						</div>
					</div>

					<div className='space-y-1'>
						<Label htmlFor={emailId}>Email</Label>
						<Input
							id={emailId}
							name='email'
							placeholder='correo@example.cl'
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							isTouched={!!formik.touched.email}
							isValid={!formik.errors.email}
							invalidFeedback={formik.touched.email ? formik.errors.email : undefined}
						/>
					</div>

					<div className='space-y-1'>
						<Label htmlFor={phoneId}>Teléfono</Label>
						<Input
							id={phoneId}
							name='phone'
							placeholder='+56 9 1234 5678'
							value={formik.values.phone}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</div>

					<div>
						<Checkbox
							label='Activo'
							name='is_active'
							checked={formik.values.is_active}
							onChange={formik.handleChange}
						/>
					</div>
				</form>
			</ModalBody>

			<ModalFooter>
				<Button variant='outline' isDisable={formik.isSubmitting} onClick={closeIfIdle}>
					Cancelar
				</Button>
				<Button
					variant='solid'
					onClick={() => formik.handleSubmit()}
					isLoading={formik.isSubmitting}
					disabled={formik.isSubmitting}>
					{isEdit ? 'Actualizar' : 'Guardar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default CreateCustomerSaleModal;
