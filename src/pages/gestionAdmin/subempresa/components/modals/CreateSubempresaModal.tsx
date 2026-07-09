import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import { ISubempresa } from '@/interface/empresas.interface';
import {
	createSubsidiaria,
	updateSubsidiaria,
	fetchMisSubsidiarias,
} from '@/store/slices/subempresa/subEmpresaSlice';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';
import { subempresaValidationSchema } from '../../helpers/subempresaValidation';
import { buildSubempresaPayload, filterAdminUsers } from '../../helpers/subempresaDataMapper';
import { handleSubempresaError } from '../../helpers/subempresaErrorHandler';
import ApiService from '@/services/ApiService';

interface CreateSubempresaModalProps {
	isOpen: boolean;
	onClose: () => void;
	subempresa: ISubempresa | null;
	companyId: number;
}

export default function CreateSubempresaModal({
	isOpen,
	onClose,
	subempresa,
	companyId,
}: CreateSubempresaModalProps) {
	const dispatch = useAppDispatch();
	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const { users } = useAppSelector((s) => s.usersAdmin);
	const isEditing = Boolean(subempresa);
	const [resolvedCompanyId, setResolvedCompanyId] = useState<number | null>(
		subempresa?.company_id ?? companyId ?? null,
	);
	const [isResolvingCompany, setIsResolvingCompany] = useState(false);

	const adminUsers = useMemo(() => filterAdminUsers(users), [users]);
	const isCompanyReady = Boolean(subempresa?.company_id ?? resolvedCompanyId ?? companyId);

	useEffect(() => {
		if (subempresa?.company_id) {
			setResolvedCompanyId(subempresa.company_id);
			return;
		}
		if (companyId) {
			setResolvedCompanyId(companyId);
		}
	}, [subempresa?.company_id, companyId]);

	useEffect(() => {
		let isMounted = true;
		const needsFetch =
			!resolvedCompanyId &&
			(!companyId || Number(companyId) <= 0) &&
			isOpen &&
			!subempresa?.company_id;

		if (!needsFetch) return;

		setIsResolvingCompany(true);
		ApiService.fetchData<{
			current_company?: { id?: number };
			personalization?: { company_id?: number };
		}>({
			url: '/user/personalization',
			method: 'get',
		})
			.then((response) => {
				if (!isMounted) return;
				const fetchedId =
					response.data?.current_company?.id ??
					response.data?.personalization?.company_id ??
					null;
				if (fetchedId) {
					setResolvedCompanyId(fetchedId);
				}
			})
			.catch(() => {
				if (isMounted) {
					toast.error('No se pudo determinar la empresa actual');
				}
			})
			.finally(() => {
				if (isMounted) {
					setIsResolvingCompany(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [resolvedCompanyId, companyId, isOpen, subempresa?.company_id]);

	const managerOptions: TSelectOption[] = useMemo(() => {
		return adminUsers.map((user: any) => ({
			value: String(user.id),
			label: `${user.first_name} ${user.last_name} - ${user.cargo || 'Sin cargo'}`,
		}));
	}, [adminUsers]);

	const formik = useFormik({
		initialValues: {
			nombre: subempresa?.subsidiary_name || '',
			managerId: subempresa?.manager?.id || subempresa?.subsidiary_manager_id || '',
			rut: subempresa?.subsidiary_rut || '',
			telefono: subempresa?.subsidiary_phone || '',
			email: subempresa?.subsidiary_email || '',
			direccion: subempresa?.subsidiary_address || '',
			region: '',
			provincia: '',
			comuna: (subempresa as any)?.commune_id
				? String((subempresa as any).commune_id)
				: (subempresa as any)?.commune?.id
					? String((subempresa as any).commune.id)
					: '',
		},
		validationSchema: subempresaValidationSchema,
		enableReinitialize: true,
		onSubmit: async (values, { setSubmitting }) => {
			try {
				const selectedManager = adminUsers.find(
					(user: any) => String(user.id) === String(values.managerId),
				);

				if (!selectedManager) {
					toast.error('Debe seleccionar un gerente responsable');
					return;
				}

				const effectiveCompanyId =
					subempresa?.company_id ?? resolvedCompanyId ?? companyId ?? null;

				if (!effectiveCompanyId || Number(effectiveCompanyId) <= 0) {
					toast.error('No se pudo determinar la empresa actual');
					return;
				}

				const data = buildSubempresaPayload(
					values,
					Number(effectiveCompanyId),
					selectedManager,
				);

				if (isEditing && subempresa?.id) {
					await dispatch(
						updateSubsidiaria({
							id: subempresa.id,
							data,
						}),
					).unwrap();
					toast.success(`"${values.nombre}" actualizada`);
				} else {
					await dispatch(createSubsidiaria(data)).unwrap();
					toast.success(`"${values.nombre}" creada`);
				}

				handleClose();
				dispatch(fetchMisSubsidiarias());
			} catch (error: any) {
				handleSubempresaError(error, isEditing);
			} finally {
				setSubmitting(false);
			}
		},
	});

	const isSubmitDisabled = formik.isSubmitting || isResolvingCompany;

	useEffect(() => {
		if (isOpen) {
			dispatch(listaRegionesThunk());
			dispatch(listaProvinciasThunk());
			dispatch(listaComunasThunk());
			if (users.length === 0) dispatch(fetchUsers({}));
		}
	}, [isOpen, dispatch, users.length]);

	useEffect(() => {
		if (isOpen && adminUsers.length === 0 && users.length > 0) {
			toast.warning('No hay usuarios con rol administrador disponibles');
		}
	}, [isOpen, adminUsers.length, users.length]);

	const { optionsRegion, optionsProvincia, optionsComuna } = useGeoSelector(
		formik as any,
		{
			regiones: listaRegiones as any,
			provincias: listaProvincias as any,
			comunas: listaComunas as any,
		},
		{ fieldRegion: 'region', fieldProvincia: 'provincia', fieldComuna: 'comuna' },
	);

	const handleClose = () => {
		formik.resetForm();
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>{isEditing ? 'Editar Subempresa' : 'Crear Subempresa'}</ModalHeader>
			<ModalBody>
				<form onSubmit={formik.handleSubmit} className='space-y-4'>
					<div>
						<Label htmlFor='nombre'>Nombre *</Label>
						<Input
							id='nombre'
							name='nombre'
							placeholder='Ej: Subsidiaria Norte'
							value={formik.values.nombre}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.nombre &&
							formik.errors.nombre &&
							typeof formik.errors.nombre === 'string' && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.nombre}</p>
							)}
					</div>

					<div>
						<Label htmlFor='managerId'>Gerente Responsable *</Label>
						<SelectReact
							id='managerId'
							name='managerId'
							options={managerOptions}
							value={
								managerOptions.find(
									(opt) => opt.value === String(formik.values.managerId),
								) || null
							}
							onChange={(option: any) => {
								formik.setFieldValue('managerId', option?.value || '');
								formik.setFieldTouched('managerId', true);
							}}
							isDisabled={
								formik.isSubmitting || adminUsers.length === 0 || isResolvingCompany
							}
							placeholder='Seleccione un gerente'
						/>
						{adminUsers.length === 0 && (
							<p className='mt-2 text-sm text-amber-600'>
								No hay gerentes disponibles. Debe crear usuarios con rol
								administrador primero.
							</p>
						)}
						{formik.touched.managerId &&
							formik.errors.managerId &&
							typeof formik.errors.managerId === 'string' && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.managerId}
								</p>
							)}
						{isResolvingCompany && !isCompanyReady && (
							<p className='mt-2 text-xs text-blue-600'>
								Determinando empresa actual...
							</p>
						)}
					</div>

					<div>
						<Label htmlFor='rut'>RUT</Label>
						<Input
							id='rut'
							name='rut'
							placeholder='Ej: 12.345.678-9'
							value={formik.values.rut}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.rut &&
							formik.errors.rut &&
							typeof formik.errors.rut === 'string' && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.rut}</p>
							)}
					</div>

					<div>
						<Label htmlFor='telefono'>Teléfono</Label>
						<Input
							id='telefono'
							name='telefono'
							placeholder='Ej: +56 9 8765 4321'
							value={formik.values.telefono}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.telefono &&
							formik.errors.telefono &&
							typeof formik.errors.telefono === 'string' && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.telefono}
								</p>
							)}
					</div>

					<div>
						<Label htmlFor='email'>Email</Label>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder='Ej: contacto@subsidiaria.com'
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.email &&
							formik.errors.email &&
							typeof formik.errors.email === 'string' && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.email}</p>
							)}
					</div>

					<div>
						<Label htmlFor='direccion'>Dirección</Label>
						<Input
							id='direccion'
							name='direccion'
							placeholder='Ej: Av. Principal 123, Ciudad'
							value={formik.values.direccion}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.direccion &&
							formik.errors.direccion &&
							typeof formik.errors.direccion === 'string' && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.direccion}
								</p>
							)}
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div>
							<Label htmlFor='region'>Región</Label>
							<SelectReact
								name='region'
								placeholder='Seleccione región'
								value={
									optionsRegion.find(
										(o) => o.value === String(formik.values.region),
									) || null
								}
								onChange={(opt) =>
									formik.setFieldValue(
										'region',
										(opt as TSelectOption | null)?.value || '',
									)
								}
								options={optionsRegion}
								isDisabled={formik.isSubmitting}
							/>
						</div>
						<div>
							<Label htmlFor='provincia'>Provincia</Label>
							<SelectReact
								name='provincia'
								placeholder='Seleccione provincia'
								value={
									optionsProvincia.find(
										(o) => o.value === String(formik.values.provincia),
									) || null
								}
								onChange={(opt) =>
									formik.setFieldValue(
										'provincia',
										(opt as TSelectOption | null)?.value || '',
									)
								}
								options={optionsProvincia}
								isDisabled={formik.isSubmitting || !formik.values.region}
							/>
						</div>
						<div>
							<Label htmlFor='comuna'>Comuna</Label>
							<SelectReact
								name='comuna'
								placeholder='Seleccione comuna'
								value={
									optionsComuna.find(
										(o) => o.value === String(formik.values.comuna),
									) || null
								}
								onChange={(opt) =>
									formik.setFieldValue(
										'comuna',
										(opt as TSelectOption | null)?.value || '',
									)
								}
								options={optionsComuna}
								isDisabled={formik.isSubmitting || !formik.values.provincia}
							/>
						</div>
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={handleClose} isDisable={isSubmitDisabled}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						onClick={() => formik.handleSubmit()}
						isLoading={formik.isSubmitting}
						isDisable={isSubmitDisabled || !isCompanyReady}>
						{isEditing ? 'Actualizar' : 'Crear'} Subempresa
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
}
