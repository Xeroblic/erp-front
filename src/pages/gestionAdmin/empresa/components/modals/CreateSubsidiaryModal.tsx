import React from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import { ISubempresa } from '@/interface/empresas.interface';
import { createSubsidiaria, updateSubsidiaria } from '@/store/slices/empresa/empresaSlice';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';

import { subsidiaryValidationSchema } from '../../helpers/subsidiaryValidation';
import { handleSubsidiaryError } from '../../helpers/subsidiaryErrorHandler';
import { buildSubsidiaryPayload, filterAdminUsers } from '../../helpers/subsidiaryDataMapper';
import { runAllPreSubmitValidations } from '../../helpers/subsidiaryPreValidation';

interface CreateSubsidiaryModalProps {
	isOpen: boolean;
	onClose: () => void;
	subsidiary: ISubempresa | null;
	onSuccess: () => void;
}

export default function CreateSubsidiaryModal({
	isOpen,
	onClose,
	subsidiary,
	onSuccess,
}: CreateSubsidiaryModalProps) {
	const dispatch = useAppDispatch();
	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const { users } = useAppSelector((s) => s.usersAdmin);
	const isEditing = Boolean(subsidiary);

	const adminUsers = React.useMemo(() => filterAdminUsers(users), [users]);

	const managerOptions: TSelectOption[] = React.useMemo(() => {
		return adminUsers.map((user: any) => ({
			value: String(user.id),
			label: `${user.first_name} ${user.last_name} - ${user.cargo || 'Sin cargo'}`,
		}));
	}, [adminUsers]);

	const formik = useFormik({
		initialValues: {
			name: subsidiary?.name || '',
			managerId: (subsidiary as any)?.manager_id || '',
			rut: subsidiary?.rut || '',
			address: subsidiary?.address || '',
			phone: subsidiary?.phone || '',
			email: subsidiary?.email || '',
			website: subsidiary?.website || '',
			region: '',
			provincia: '',
			comuna: (subsidiary as any)?.commune_id
				? String((subsidiary as any).commune_id)
				: (subsidiary as any)?.commune?.id
					? String((subsidiary as any).commune.id)
					: '',
			commune_id:
				(subsidiary as any)?.commune_id ?? (subsidiary as any)?.commune?.id ?? undefined,
		},
		validationSchema: subsidiaryValidationSchema,
		enableReinitialize: true,
		validateOnChange: true,
		validateOnBlur: true,
		onSubmit: async (values, { setSubmitting, setFieldError }) => {
			try {
				const selectedManager = adminUsers.find(
					(user: any) => String(user.id) === String(values.managerId),
				);

				const isValid = runAllPreSubmitValidations({
					values,
					setFieldError,
					adminUsersCount: adminUsers.length,
					selectedManager,
				});

				if (!isValid) return;

				const subsidiaryData = buildSubsidiaryPayload(values, selectedManager);

				if (isEditing && subsidiary?.id) {
					const action = await dispatch(
						updateSubsidiaria({
							id: subsidiary.id,
							data: subsidiaryData,
						}),
					);
					unwrapResult(action);
				} else {
					const action = await dispatch(createSubsidiaria(subsidiaryData));
					unwrapResult(action);
				}

				toast.success(
					isEditing ? `"${values.name}" actualizada` : `"${values.name}" creada`,
				);

				formik.resetForm();
				onSuccess();
			} catch (error: any) {
				handleSubsidiaryError(error, values, setFieldError);
			} finally {
				setSubmitting(false);
			}
		},
	});

	React.useEffect(() => {
		if (isOpen) {
			if (!listaRegiones?.length) dispatch(listaRegionesThunk());
			if (!listaProvincias?.length) dispatch(listaProvinciasThunk());
			if (!listaComunas?.length) dispatch(listaComunasThunk());
			if (users.length === 0) dispatch(fetchUsers({}));
		}
	}, [
		isOpen,
		dispatch,
		listaRegiones?.length,
		listaProvincias?.length,
		listaComunas?.length,
		users.length,
	]);

	React.useEffect(() => {
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

	const handleSubmitClick = () => {
		if (!formik.isValid) {
			const errors = Object.entries(formik.errors);
			if (errors.length > 0) {
				const [field, message] = errors[0];
				const fieldLabels: Record<string, string> = {
					name: 'Nombre',
					managerId: 'Gerente',
					rut: 'RUT',
					address: 'Dirección',
					phone: 'Teléfono',
					email: 'Email',
					website: 'Sitio web',
					comuna: 'Comuna',
				};
				const fieldLabel = fieldLabels[field] || field;
				toast.error(`${fieldLabel}: ${message}`);
			}
		} else if (!formik.dirty) {
			toast.info('No hay cambios para guardar');
		}
		formik.handleSubmit();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => handleClose()}>
			<ModalHeader>
				<h3 className='text-lg font-semibold'>
					{isEditing ? 'Editar Subempresa' : 'Nueva Subempresa'}
				</h3>
				<p className='ml-3 mt-1 text-sm text-zinc-500'>
					{isEditing ? 'Modifica los datos' : 'Complete los campos obligatorios (*)'}
				</p>
			</ModalHeader>

			<ModalBody>
				<form onSubmit={formik.handleSubmit} className='space-y-4'>
					{/* Campos Básicos */}
					<div>
						<Label htmlFor='name'>Nombre de la subempresa *</Label>
						<Input
							id='name'
							name='name'
							placeholder='Ej: Sucursal Norte, Almacén Centro'
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.name &&
							formik.errors.name &&
							typeof formik.errors.name === 'string' && (
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.name}
								</p>
							)}
					</div>

					<div>
						<Label htmlFor='rut'>RUT de la subempresa</Label>
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
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.rut}
								</p>
							)}
					</div>

					<div>
						<Label htmlFor='address'>Dirección completa</Label>
						<Input
							id='address'
							name='address'
							placeholder='Ej: Av. Principal 123, Comuna, Ciudad'
							value={formik.values.address}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.address &&
							formik.errors.address &&
							typeof formik.errors.address === 'string' && (
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.address}
								</p>
							)}
					</div>

					{/* Gerente Responsable */}
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
							isDisabled={formik.isSubmitting || adminUsers.length === 0}
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
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.managerId}
								</p>
							)}
					</div>

					{/* Campos de Contacto */}
					<div>
						<Label htmlFor='phone'>Teléfono</Label>
						<Input
							id='phone'
							name='phone'
							placeholder='Ej: +56 9 1234 5678'
							value={formik.values.phone}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.phone &&
							formik.errors.phone &&
							typeof formik.errors.phone === 'string' && (
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.phone}
								</p>
							)}
					</div>

					<div>
						<Label htmlFor='email'>Email de contacto</Label>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder='Ej: contacto@empresa.com'
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.email &&
							formik.errors.email &&
							typeof formik.errors.email === 'string' && (
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.email}
								</p>
							)}
					</div>

					<div>
						<Label htmlFor='website'>Sitio web</Label>
						<Input
							id='website'
							name='website'
							placeholder='Ej: https://www.empresa.com'
							value={formik.values.website}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.website &&
							formik.errors.website &&
							typeof formik.errors.website === 'string' && (
								<p className='mt-1 text-sm font-medium text-red-600'>
									{formik.errors.website}
								</p>
							)}
					</div>

					{/* Selectores Geográficos */}
					<div className='grid grid-cols-3 gap-4'>
						<div>
							<Label htmlFor='region'>Región</Label>
							<SelectReact
								id='region'
								name='region'
								options={optionsRegion}
								value={
									optionsRegion.find(
										(opt) => opt.value === formik.values.region,
									) || null
								}
								onChange={(option: any) => {
									formik.setFieldValue('region', option?.value || '');
									formik.setFieldValue('provincia', '');
									formik.setFieldValue('comuna', '');
								}}
								isDisabled={formik.isSubmitting}
								placeholder='Seleccionar'
							/>
						</div>
						<div>
							<Label htmlFor='provincia'>Provincia</Label>
							<SelectReact
								id='provincia'
								name='provincia'
								options={optionsProvincia}
								value={
									optionsProvincia.find(
										(opt) => opt.value === formik.values.provincia,
									) || null
								}
								onChange={(option: any) => {
									formik.setFieldValue('provincia', option?.value || '');
									formik.setFieldValue('comuna', '');
								}}
								isDisabled={formik.isSubmitting || !formik.values.region}
								placeholder='Seleccionar'
							/>
						</div>
						<div>
							<Label htmlFor='comuna'>Comuna</Label>
							<SelectReact
								id='comuna'
								name='comuna'
								options={optionsComuna}
								value={
									optionsComuna.find(
										(opt) => opt.value === formik.values.comuna,
									) || null
								}
								onChange={(option: any) => {
									formik.setFieldValue('comuna', option?.value || '');
								}}
								isDisabled={formik.isSubmitting || !formik.values.provincia}
								placeholder='Seleccionar'
							/>
						</div>
					</div>

					<div className='mt-6 flex justify-end gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-700'>
						<Button
							variant='outline'
							onClick={handleClose}
							isDisable={formik.isSubmitting}>
							Cancelar
						</Button>
						<Button
							variant='solid'
							onClick={handleSubmitClick}
							isLoading={formik.isSubmitting}
							isDisable={
								!formik.isValid || formik.isSubmitting || adminUsers.length === 0
							}>
							{isEditing ? 'Guardar Cambios' : 'Crear Subempresa'}
						</Button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
}
