/* eslint-disable import/extensions */
import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { Formik, Form, type FormikHelpers, type FormikProps } from 'formik';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Textarea from '@/components/form/Textarea';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import RoleSelect from '@/components/form/RoleSelect';
import PermissionSelect from '@/components/form/PermissionSelect';
import { normalizeRoleKey } from '@/pages/admin/Permission/utils/formatters';
import type { Permission, Role } from '@/store/slices/permissions/permissionsSlice';
import type { CreateInvitationData } from '@/interface/invitacion.interface';
import type { SingleValue } from 'react-select';
import Button from '@/components/ui/Button';
import ApiService from '@/services/ApiService';
import { useAppSelector } from '@/store';

interface CreateInvitationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	onSubmit: (data: CreateInvitationData) => Promise<void>;
	roles: Role[];
	permissions: Permission[];
	isLoadingRoles: boolean;
	isLoadingPermissions: boolean;
}

interface FormValues {
	email: string;
	first_name: string;
	last_name: string;
	role_id: string;
	position: string;
	rut: string;
	company_id: number | null;
	branch_id: string;
	message: string;
	permissions: string[];
}

const validationSchema = Yup.object({
	email: Yup.string().email('El email no es valido').required('El email es requerido'),
	first_name: Yup.string().required('El nombre es requerido'),
	last_name: Yup.string().required('El apellido es requerido'),
	role_id: Yup.string().required('El rol es requerido'),
	branch_id: Yup.string().required('La sucursal es requerida'),
	rut: Yup.string(),
	message: Yup.string(),
});

const CreateInvitationModal: React.FC<CreateInvitationModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	onSubmit,
	roles,
	permissions,
	isLoadingRoles,
	isLoadingPermissions,
}) => {
	const [branchOptions, setBranchOptions] = useState<TSelectOption[]>([]);
	const [isLoadingBranches, setIsLoadingBranches] = useState(false);
	const [companyIdSnapshot, setCompanyIdSnapshot] = useState<number | null>(null);
	const [branchDefaultSnapshot, setBranchDefaultSnapshot] = useState<string>('');
	const branchSubsidiaryMapRef = useRef<Record<string, number>>({});
	const formikRef = useRef<FormikProps<FormValues>>(null);
	const currentUser = useAppSelector((state) => state.auth.user);
	const currentAuthority = useAppSelector((state) => state.auth.permisos);

	const isSuperAdmin = useMemo(() => {
		const possibleRoles = [
			...(currentUser?.roles ?? []),
			...(Array.isArray(currentUser?.authority) ? currentUser.authority : []),
			...currentAuthority,
		];

		return possibleRoles.some(
			(role) => normalizeRoleKey(typeof role === 'string' ? role : String(role)) === 'superadmin',
		);
	}, [currentUser?.roles, currentUser?.authority, currentAuthority]);

	const availableRoles = useMemo(() => {
		return roles.filter((role) => {
			if (isSuperAdmin) return true;
			return normalizeRoleKey(role.display_name || role.name) !== 'superadmin';
		});
	}, [roles, isSuperAdmin]);

	const defaultRoleId = useMemo(() => {
		return availableRoles.length ? String(availableRoles[0].id) : '';
	}, [availableRoles]);

	const fetchCompanyContext = useCallback(async () => {
		setIsLoadingBranches(true);
		try {
			const response = await ApiService.fetchData<{
				current_company?: {
					id: number;
					company_name: string;
					subsidiaries?: Array<{
						id: number;
						subsidiary_name: string;
						branches?: Array<{ id: number; branch_name: string }>;
					}>;
				} | null;
			}>({ url: '/user/personalization', method: 'get', dedupe: true });

			const currentCompany = response.data.current_company || null;
			setCompanyIdSnapshot(currentCompany?.id ?? null);

			const options: TSelectOption[] = [];
			const branchMap: Record<string, number> = {};

			currentCompany?.subsidiaries?.forEach((subsidiary) => {
				subsidiary.branches?.forEach((branch) => {
					const value = String(branch.id);
					const label = `${subsidiary.subsidiary_name} - ${branch.branch_name}`;
					options.push({ value, label });
					branchMap[value] = subsidiary.id;
				});
			});

			branchSubsidiaryMapRef.current = branchMap;
			setBranchOptions(options);
			setBranchDefaultSnapshot(options[0]?.value ?? '');

			const formik = formikRef.current;
			if (formik) {
				const hasCompany = Boolean(formik.values.company_id);
				if (!hasCompany && currentCompany?.id) {
					formik.setFieldValue('company_id', currentCompany.id, false);
				} else if (
					currentCompany?.id &&
					formik.values.company_id !== currentCompany.id
				) {
					formik.setFieldValue('company_id', currentCompany.id, false);
				}

				const currentBranch = formik.values.branch_id;
				const branchStillValid =
					currentBranch &&
					options.some((option) => option.value === currentBranch);
				if (!branchStillValid) {
					formik.setFieldValue('branch_id', options[0]?.value ?? '', false);
				}
			}
		} catch (error) {
			console.error('Error fetching company context for invitations:', error);
			toast.error('No se pudo cargar la información de la empresa');
			branchSubsidiaryMapRef.current = {};
			setBranchOptions([]);
			setCompanyIdSnapshot(null);
			setBranchDefaultSnapshot('');
		} finally {
			setIsLoadingBranches(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			void fetchCompanyContext();
		}
	}, [isOpen, fetchCompanyContext]);

	useEffect(() => {
		const formik = formikRef.current;
		if (!formik) return;

		if (!formik.values.company_id && companyIdSnapshot) {
			formik.setFieldValue('company_id', companyIdSnapshot, false);
		}

		if (!formik.values.branch_id && branchDefaultSnapshot) {
			formik.setFieldValue('branch_id', branchDefaultSnapshot, false);
		}
	}, [companyIdSnapshot, branchDefaultSnapshot]);

	useEffect(() => {
		const formik = formikRef.current;
		if (!formik) return;

		if (!availableRoles.length) {
			if (formik.values.role_id) {
				formik.setFieldValue('role_id', '', false);
			}
			return;
		}

		const hasCurrentRole = availableRoles.some(
			(role) => String(role.id) === String(formik.values.role_id),
		);
		if (!hasCurrentRole) {
			formik.setFieldValue('role_id', String(availableRoles[0].id), false);
		}
	}, [availableRoles]);

	const branchPlaceholder = useMemo(() => {
		if (isLoadingBranches) return 'Cargando sucursales...';
		if (!branchOptions.length) return 'No hay sucursales disponibles';
		return 'Selecciona una sucursal';
	}, [isLoadingBranches, branchOptions.length]);

	const initialValues = useMemo<FormValues>(
		() => ({
			email: '',
			first_name: '',
			last_name: '',
			role_id: defaultRoleId,
			position: '',
			rut: '',
			company_id: null,
			branch_id: '',
			message: '',
			permissions: [],
		}),
		[defaultRoleId],
	);

	const normalizeField = (value: string): string | undefined => {
		const trimmed = value.trim();
		return trimmed || undefined;
	};

	const buildPayload = (
		values: FormValues,
		selectedRole: Role,
	): CreateInvitationData => {
		const message = values.message.trim();
		const companyIdentifier = values.company_id ?? undefined;
		const branchIdentifier = values.branch_id ? Number(values.branch_id) : undefined;
		const subsidiaryId =
			values.branch_id && branchSubsidiaryMapRef.current[values.branch_id]
				? branchSubsidiaryMapRef.current[values.branch_id]
				: undefined;

		if (!companyIdentifier) {
			throw new Error('No se pudo determinar la empresa seleccionada');
		}
		if (!branchIdentifier) {
			throw new Error('Selecciona una sucursal válida');
		}

		return {
			email: values.email.trim(),
			first_name: values.first_name.trim(),
			last_name: values.last_name.trim(),
			role_id: selectedRole.id,
			company_id: companyIdentifier,
			subsidiary_id: subsidiaryId,
			branch_id: branchIdentifier,
			position: normalizeField(values.position),
			rut: normalizeField(values.rut),
			data: message ? { message } : undefined,
			ttl_days: 7,
			permissions: values.permissions.length ? values.permissions : undefined,
		};
	};

	const handleServerError = (
		err: any,
		setFieldError: FormikHelpers<FormValues>['setFieldError'],
	) => {
		const errorPayload = err?.response?.data    ;

		if (errorPayload?.errors) {
			Object.entries(errorPayload.errors).forEach(([field, messages]) => {
				if (Array.isArray(messages) && messages.length) {
					setFieldError(field, String(messages[0]));
				}
			});
		}

		const message = errorPayload?.message ?? 'Error al enviar la invitacion';
		toast.error(message);
	};

	const handleSubmit = async (
		values: FormValues,
		{ setSubmitting, resetForm, setFieldError }: FormikHelpers<FormValues>,
	) => {
		try {
			const selectedRole = roles.find((role) => String(role.id) === String(values.role_id));

			if (!selectedRole) {
				setFieldError('role_id', 'Selecciona un rol valido');
				return;
			}

			let payload: CreateInvitationData;
			try {
				payload = buildPayload(values, selectedRole);
			} catch (buildError: any) {
				const errorMessage =
					buildError?.message || 'No se pudo preparar la invitación';
				toast.error(errorMessage);
				return;
			}
			await onSubmit(payload);

			resetForm();
			onClose();
			onSuccess();
		} catch (err: any) {
			handleServerError(err, setFieldError);
		} finally {
			setSubmitting(false);
		}
	};

	const handleClose = () => {
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='md' isStaticBackdrop isStaticBackdropAnimation>
			<ModalHeader>
				<Icon icon='HeroPlusCircle' />
				<Badge> Nueva Invitacion </Badge>
			</ModalHeader>

			<Formik
				innerRef={formikRef}
				initialValues={initialValues}
				enableReinitialize
				validationSchema={validationSchema}
				onSubmit={handleSubmit}>
				{({
					values,
					errors,
					touched,
					handleChange,
					handleBlur,
					isSubmitting,
					setFieldValue,
				}) => (
					<Form>
						<ModalBody className='space-y-6'>
							<FieldWrap
								isValid={!errors.email}
								isTouched={touched.email}
								invalidFeedback={errors.email}>
								<div>
									<Label htmlFor='email'>
										Email *
									</Label>
									<Input
										name='email'
										type='email'
										value={values.email}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='ejemplo@empresa.com'
										
										isValid={!errors.email}
										isTouched={touched.email}
										invalidFeedback={errors.email}
									/>
								</div>
							</FieldWrap>

							<FieldWrap
								isValid={!errors.first_name}
								isTouched={touched.first_name}
								invalidFeedback={errors.first_name}>
								<div>
									<Label htmlFor='first_name'>
										Nombre *
									</Label>
									<Input
										name='first_name'
										type='text'
										value={values.first_name}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='Juan'
										
										isValid={!errors.first_name}
										isTouched={touched.first_name}
										invalidFeedback={errors.first_name}
									/>
								</div>
							</FieldWrap>

							<FieldWrap
								isValid={!errors.last_name}
								isTouched={touched.last_name}
								invalidFeedback={errors.last_name}>
								<div>
									<Label htmlFor='last_name'>
										Apellido *
									</Label>
									<Input
										name='last_name'
										type='text'
										value={values.last_name}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='Perez'
										
										isValid={!errors.last_name}
										isTouched={touched.last_name}
										invalidFeedback={errors.last_name}
									/>
								</div>
							</FieldWrap>

			<FieldWrap
				isValid={!errors.role_id}
				isTouched={touched.role_id}
				invalidFeedback={errors.role_id}>
				<div>
					<Label htmlFor='role_id'>
						Rol *
					</Label>
					<RoleSelect
						name='role_id'
						roles={availableRoles}
						value={values.role_id}
						onChange={(roleId) => setFieldValue('role_id', roleId)}
						isLoading={isLoadingRoles}
					/>
				</div>
			</FieldWrap>

							<FieldWrap
								isValid={!errors.branch_id}
								isTouched={touched.branch_id}
								invalidFeedback={errors.branch_id}>
								<div>
									<Label htmlFor='branch_id'>Sucursal *</Label>
									<SelectReact
										name='branch_id'
										options={branchOptions}
										value={
											branchOptions.find(
												(option) => option.value === values.branch_id,
											) ?? null
										}
										onChange={(option) => {
											const selected = option as SingleValue<TSelectOption>;
											setFieldValue('branch_id', selected?.value ?? '');
										}}
										isLoading={isLoadingBranches}
										placeholder={branchPlaceholder}
										isDisabled={
											isLoadingBranches || branchOptions.length === 0
										}
									/>
								</div>
							</FieldWrap>

							<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
								<FieldWrap
									isValid={!errors.rut}
									isTouched={touched.rut}
									invalidFeedback={errors.rut}>
									<div>
										<Label htmlFor='rut'>
											RUT *
										</Label>
										<Input
											name='rut'
											type='text'
											value={values.rut}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder='12.345.678-9'
											
											isValid={!errors.rut}
											isTouched={touched.rut}
											invalidFeedback={errors.rut}
										/>
									</div>
								</FieldWrap>
								<FieldWrap>
									<div>
										<Label htmlFor='position'>
											Cargo
										</Label>
										<Input
											name='position'
											type='text'
											value={values.position}
											onChange={handleChange}
											onBlur={handleBlur}
											placeholder='Administrador de Recursos Humanos'
											
										/>
									</div>
								</FieldWrap>
							</div>

			<FieldWrap>
				<div>
					<Label htmlFor='permissions'>
						Permisos adicionales
					</Label>
					<PermissionSelect
						name='permissions'
						permissions={permissions}
						value={values.permissions}
						onChange={(selected) => setFieldValue('permissions', selected)}
						isLoading={isLoadingPermissions}
					/>
					<p className='mt-2 text-xs text-zinc-500'>
						Estos permisos se agregaran ademas de los permisos otorgados
						por el rol seleccionado.
					</p>
				</div>
			</FieldWrap>

							<FieldWrap>
								<div>
									<Label htmlFor='message'>
										Mensaje personalizado (opcional)
									</Label>
									<Textarea
										name='message'
										rows={3}
										value={values.message}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder='Mensaje adicional para incluir en la invitacion...'
										
									/>
								</div>
							</FieldWrap>
						</ModalBody>

						<ModalFooter>
							<ModalFooterChild>
								<Button variant='outline' onClick={handleClose} icon='HeroXMark'>
									Cancelar
								</Button>
							</ModalFooterChild>

							<ModalFooterChild>
								<Button
									onClick={() => formikRef.current?.submitForm()}
									variant='solid'
									color='blue'
									icon='HeroPaperAirplane'
									isDisable={isSubmitting || !values.role_id}>
									{isSubmitting ? 'Enviando...' : 'Enviar Invitacion'}
								</Button>
							</ModalFooterChild>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};

export default CreateInvitationModal;
