import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '@/store';
import { createSucursal, updateSucursal } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import SelectReact, { TSelectOption } from '../../../../components/form/SelectReact';
import { ISucursal } from '@/interface/empresas.interface';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';
import { useBranchManagers } from '../hooks/useBranchManagers';
import Icon from '@/components/icon/Icon';
import { SelectComune } from '@/components/utils/selects/SelectComune';

interface SucursalModalProps {
	isOpen: boolean;
	onClose: () => void;
	sucursal: ISucursal | null;
	onSuccess: () => void;
}

const validationSchema = Yup.object({
	name: Yup.string()
		.required('El nombre es obligatorio')
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(100, 'El nombre no puede exceder 100 caracteres'),
	subsidiary_id: Yup.number().required('Debe seleccionar una subsidiaria'),
	rut: Yup.string()
		.nullable()
		.matches(/^[\dkK\-]+$/i, 'Formato de RUT inválido')
		.min(8, 'El RUT debe tener al menos 8 caracteres')
		.max(12, 'El RUT no puede exceder 12 caracteres'),
	address: Yup.string().nullable().max(200, 'La dirección no puede exceder 200 caracteres'),
	phone: Yup.string()
		.nullable()
		.matches(/^[\d\s\-\+\(\)]*$/, 'Formato de teléfono inválido')
		.max(20, 'El teléfono no puede exceder 20 caracteres'),
	email: Yup.string()
		.nullable()
		.email('Formato de email inválido')
		.max(100, 'El email no puede exceder 100 caracteres'),
	manager_id: Yup.number().nullable().integer('Debe seleccionar un usuario válido'),
});

export default function SucursalModal({
	isOpen,
	onClose,
	sucursal,
	onSuccess,
}: SucursalModalProps) {
	const dispatch = useAppDispatch();
	const subsidiaries = useAppSelector((s) => s.subEmpresa.lista);
	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const isEditing = Boolean(sucursal);

	// Cargar subsidiarias al abrir el modal
	useEffect(() => {
		if (isOpen) {
			dispatch(fetchMisSubsidiarias());
		}
	}, [isOpen, dispatch]);

	// Cargar listas geo si faltan
	useEffect(() => {
		if (isOpen) {
			if (!listaRegiones?.length) dispatch(listaRegionesThunk());
			if (!listaProvincias?.length) dispatch(listaProvinciasThunk());
			if (!listaComunas?.length) dispatch(listaComunasThunk());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	const formik = useFormik({
		initialValues: {
			name: '',
			subsidiary_id: '',
			rut: '',
			address: '',
			phone: '',
			email: '',
			manager_id: '',
			region: '',
			provincia: '',
			comuna: '',
			commune_id: undefined as any,
		},
		validationSchema,
		onSubmit: async (values) => {
			try {
				// Limpiar valores vacíos y mapear a nombres del backend
				const sucursalData = {
					branch_name: values.name.trim(), // ✅ Backend espera branch_name
					subsidiary_id: Number(values.subsidiary_id),
					branch_rut: values.rut.trim() || undefined,
					branch_address: values.address.trim() || undefined,
					branch_phone: values.phone.trim() || undefined,
					branch_email: values.email.trim() || undefined,
					manager_id: values.manager_id ? Number(values.manager_id) : undefined,
					commune_id: values.comuna ? Number(values.comuna) : undefined,
				};

				if (isEditing && sucursal?.id) {
					// 📝 Actualizar sucursal existente
					const action = await dispatch(
						updateSucursal({
							id: sucursal.id,
							data: sucursalData,
						}),
					);
					unwrapResult(action);
				} else {
					// ➕ Crear nueva sucursal
					const action = await dispatch(createSucursal(sucursalData));
					unwrapResult(action);
				}

				toast.success(
					isEditing
						? `${values.name} ha sido actualizada correctamente`
						: `${values.name} ha sido creada correctamente`,
				);

				onSuccess();
			} catch (error: any) {
				console.error('Error al guardar sucursal:', error);
				toast.error(
					isEditing ? 'Error al actualizar la sucursal' : 'Error al crear la sucursal',
				);
			}
		},
	});

	// Cargar datos cuando se abre el modal para edición
	useEffect(() => {
		if (isOpen) {
			if (isEditing && sucursal) {
				formik.setValues({
					name: sucursal.branch_name || '',
					subsidiary_id: sucursal.subsidiary_id?.toString() || '',
					rut: sucursal.branch_rut || '',
					address: sucursal.branch_address || '',
					phone: sucursal.branch_phone || '',
					email: sucursal.branch_email || '',
					manager_id: (sucursal as any)?.manager_id?.toString() || '',
					region: '',
					provincia: '',
					comuna: (sucursal as any)?.commune_id
						? String((sucursal as any).commune_id)
						: (sucursal as any)?.commune?.id
							? String((sucursal as any).commune.id)
							: '',
					commune_id:
						(sucursal as any)?.commune_id ??
						(sucursal as any)?.commune?.id ??
						undefined,
				});
			} else {
				formik.resetForm();
			}
		}
	}, [isOpen, isEditing, sucursal]);

	const handleClose = () => {
		formik.resetForm();
		onClose();
	};

	// Opciones para el selector de subsidiarias
	const subsidiaryOptions = subsidiaries.map((sub) => ({
		value: sub.id.toString(),
		label: sub.subsidiary_name,
	}));

	// Hook para obtener managers disponibles (usuarios con acceso a la sucursal)
	const { managerOptions, loading: loadingManagers } = useBranchManagers({
		branchId: isEditing ? sucursal?.id : undefined,
		subsidiaryId: formik.values.subsidiary_id || undefined,
		enabled: isOpen && (!!formik.values.subsidiary_id || isEditing),
	});

	const { optionsRegion, optionsProvincia, optionsComuna } = useGeoSelector(
		formik as any,
		{
			regiones: listaRegiones as any,
			provincias: listaProvincias as any,
			comunas: listaComunas as any,
		},
		{ fieldRegion: 'region', fieldProvincia: 'provincia', fieldComuna: 'comuna' },
	);

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose}>
			<ModalHeader>{isEditing ? 'Editar Sucursal' : 'Crear Nueva Sucursal'}</ModalHeader>
			<ModalBody>
				<form onSubmit={formik.handleSubmit} className='space-y-6'>
					{/* Información Básica */}
					<div className='space-y-4'>
						<h3 className='border-b pb-2 text-lg font-medium'>Información Básica</h3>

						{/* Nombre */}
						<div>
							<Label htmlFor='name'>Nombre de la Sucursal *</Label>
							<Input
								id='name'
								name='name'
								placeholder='Ej: Sucursal Centro'
								value={formik.values.name}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
							{formik.touched.name && formik.errors.name && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.name}</p>
							)}
						</div>

						{/* Subsidiaria */}
						<div>
							<Label htmlFor='subsidiary_id'>Subsidiaria *</Label>
							<SelectReact
								id='subsidiary_id'
								name='subsidiary_id'
								placeholder='Seleccione una subsidiaria...'
								value={
									(subsidiaryOptions.find(
										(opt) => opt.value === formik.values.subsidiary_id,
									) as TSelectOption | undefined) || null
								}
								onChange={(selectedOption) => {
									const option = selectedOption as TSelectOption | null;
									formik.setFieldValue('subsidiary_id', option?.value || '');
								}}
								onBlur={() => formik.setFieldTouched('subsidiary_id', true)}
								isDisabled={formik.isSubmitting}
								options={subsidiaryOptions as TSelectOption[]}
							/>
							{formik.touched.subsidiary_id && formik.errors.subsidiary_id && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.subsidiary_id}
								</p>
							)}
						</div>

						{/* RUT */}
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
							{formik.touched.rut && formik.errors.rut && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.rut}</p>
							)}
						</div>

						{/* Dirección */}
						<div>
							<Label htmlFor='address'>Dirección</Label>
							<Input
								id='address'
								name='address'
								placeholder='Ej: Av. Principal 123, Ciudad'
								value={formik.values.address}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
							{formik.touched.address && formik.errors.address && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.address}</p>
							)}
						</div>

						{/* Región / Provincia / Comuna */}
						{/* <div>
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
										) ||
										(formik.values.comuna
											? ({
													value: String(formik.values.comuna),
													label: 'Cargando…',
												} as TSelectOption)
											: null)
									}
									onChange={(opt) => {
										const v = (opt as TSelectOption | null)?.value || '';
										formik.setFieldValue('comuna', v);
										formik.setFieldValue(
											'commune_id',
											v ? Number(v) : undefined,
										);
									}}
									options={optionsComuna}
								/>
							</div> */}

						<SelectComune
							name='comuna'
							label='Comuna'
							placeholder='Seleccione comuna'
							isRequired
							value={formik.values.comuna || formik.values.commune_id?.toString()}
							error={formik.touched.comuna ? formik.errors.comuna : undefined}
							disabled={formik.isSubmitting}
							onChange={(val, data) => {
								formik.setFieldValue('comuna', val);
								formik.setFieldValue('commune_id', val ? Number(val) : undefined);
								if (data) {
									formik.setFieldValue('provincia', data.province_id);
									formik.setFieldValue('region', data.region_id);
								} else {
									formik.setFieldValue('provincia', '');
									formik.setFieldValue('region', '');
								}
							}}
						/>
					</div>

					{/* Información de Contacto */}
					<div className='space-y-4'>
						<h3 className='border-b pb-2 text-lg font-medium'>
							Información de Contacto
						</h3>

						{/* Teléfono */}
						<div>
							<Label htmlFor='phone'>Teléfono</Label>
							<Input
								id='phone'
								name='phone'
								placeholder='Ej: +56 2 2234 5678'
								value={formik.values.phone}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
							{formik.touched.phone && formik.errors.phone && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.phone}</p>
							)}
						</div>

						{/* Email */}
						<div>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								name='email'
								type='email'
								placeholder='Ej: sucursal@empresa.com'
								value={formik.values.email}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
							{formik.touched.email && formik.errors.email && (
								<p className='mt-1 text-sm text-red-600'>{formik.errors.email}</p>
							)}
						</div>
					</div>

					{/* Información del Encargado */}
					<div className='space-y-4'>
						<h3 className='flex items-center gap-2 border-b pb-2 text-lg font-medium'>
							<Icon icon='HeroUser' className='text-zinc-600' />
							Encargado de Sucursal
						</h3>

						<div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
							<div className='flex items-start gap-3'>
								<Icon
									icon='HeroInformationCircle'
									className='mt-0.5 flex-shrink-0 text-blue-600'
								/>
								<div className='text-sm text-blue-800 dark:text-blue-300'>
									<p className='mb-1 font-medium'>
										Seleccione un usuario registrado
									</p>
									<p>
										El encargado debe ser un usuario activo con acceso a esta
										sucursal y con permisos de administración o gestión.
									</p>
								</div>
							</div>
						</div>

						{/* Selector de Encargado */}
						<div>
							<Label htmlFor='manager_id'>Encargado / Manager</Label>
							<SelectReact
								id='manager_id'
								name='manager_id'
								placeholder={
									loadingManagers
										? 'Cargando usuarios...'
										: managerOptions.length === 0
											? 'No hay usuarios disponibles'
											: 'Seleccione un encargado...'
								}
								value={
									managerOptions.find(
										(opt) => opt.value === formik.values.manager_id,
									) || null
								}
								onChange={(selectedOption) => {
									const option = selectedOption as TSelectOption | null;
									formik.setFieldValue('manager_id', option?.value || '');
								}}
								onBlur={() => formik.setFieldTouched('manager_id', true)}
								isDisabled={
									formik.isSubmitting ||
									loadingManagers ||
									managerOptions.length === 0
								}
								isLoading={loadingManagers}
								options={managerOptions}
								isClearable
							/>
							{formik.touched.manager_id && formik.errors.manager_id && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.manager_id}
								</p>
							)}
							{!loadingManagers &&
								managerOptions.length === 0 &&
								formik.values.subsidiary_id && (
									<p className='mt-2 flex items-center gap-1 text-sm text-amber-600'>
										<Icon icon='HeroExclamationTriangle' className='text-xs' />
										No se encontraron usuarios elegibles. Asegúrese de que hay
										usuarios con acceso a esta subsidiaria.
									</p>
								)}
						</div>
					</div>
				</form>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={handleClose} isDisable={formik.isSubmitting}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						onClick={() => formik.handleSubmit()}
						isLoading={formik.isSubmitting}
						isDisable={formik.isSubmitting}>
						{formik.isSubmitting
							? isEditing
								? 'Actualizando...'
								: 'Creando...'
							: isEditing
								? 'Actualizar'
								: 'Crear'}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
}
