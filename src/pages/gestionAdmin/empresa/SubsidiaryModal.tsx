import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Label from '@/components/form/Label';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { ISubempresa } from '@/interface/empresas.interface';
import { createSubsidiaria, updateSubsidiaria } from '@/store/slices/empresa/empresaSlice';
import { unwrapResult } from '@reduxjs/toolkit';
import {
	listaComunasThunk,
	listaProvinciasThunk,
	listaRegionesThunk,
} from '@/store/slices/core/coreSlice';
import { useGeoSelector } from '@/hooks/useGeoSelector';

interface SubsidiaryModalProps {
	isOpen: boolean;
	onClose: () => void;
	subsidiary: ISubempresa | null;
	onSuccess: () => void;
}

const validationSchema = Yup.object({
	name: Yup.string()
		.required('El nombre es requerido')
		.min(2, 'El nombre debe tener al menos 2 caracteres')
		.max(100, 'El nombre no puede exceder 100 caracteres'),
	rut: Yup.string()
		.nullable()
		.matches(/^[\d\.-k]+$/i, 'Formato de RUT inválido')
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
	website: Yup.string()
		.nullable()
		.url('Formato de URL inválido')
		.max(100, 'El sitio web no puede exceder 100 caracteres'),
});

export default function SubsidiaryModal({
	isOpen,
	onClose,
	subsidiary,
	onSuccess,
}: SubsidiaryModalProps) {
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);
	const personalizacionState = useAppSelector((s) => s.personalizacion);
	const { listaRegiones, listaProvincias, listaComunas } = useAppSelector((s) => s.core);
	const isEditing = Boolean(subsidiary);

	const companyId =
		personalizacionState?.personalizacionUsuario?.company_id ||
		personalizacionState?.personalizacionUsuario?.empresa ||
		user?.company?.id ||
		(user?.personalizacion?.empresa ?? undefined) ||
		(user?.branch as any)?.subsidiary?.company_id;

	console.log('COMPANY ID FINAL:', companyId);
	console.log('personalizacionState:', personalizacionState);
	const formik = useFormik({
		initialValues: {
			name: subsidiary?.name || '',
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
		validationSchema,
		enableReinitialize: true,
		onSubmit: async (values, { setSubmitting }) => {
			try {
				if (!companyId) {
					toast.error(
						'No se pudo obtener el ID de la empresa. Por favor, recarga la página.',
					);
					return;
				}

				const subsidiaryData = {
					subsidiary_name: values.name.trim(),
					subsidiary_rut: values.rut.trim() || undefined,
					subsidiary_address: values.address.trim() || undefined,
					subsidiary_phone: values.phone.trim() || undefined,
					subsidiary_email: values.email.trim() || undefined,
					subsidiary_website: values.website.trim() || undefined,
					commune_id: values.comuna ? Number(values.comuna) : undefined,
					company_id: companyId,
				};

				if (isEditing && subsidiary?.id) {
					// Actualizar subsidiaria existente
					const action = await dispatch(
						updateSubsidiaria({
							id: subsidiary.id,
							data: subsidiaryData,
						}),
					);
					unwrapResult(action);
				} else {
					// ➕ Crear nueva subsidiaria
					const action = await dispatch(createSubsidiaria(subsidiaryData));
					unwrapResult(action);
				}

				toast.success(
					isEditing
						? `${values.name} ha sido actualizada correctamente`
						: `${values.name} ha sido creada correctamente`,
				);

				onSuccess();
			} catch (error: any) {
				console.error('Error al guardar subempresa:', error);
				toast.error(
					isEditing
						? 'Error al actualizar la subempresa'
						: 'Error al crear la subempresa',
				);
			} finally {
				setSubmitting(false);
			}
		},
	});

	// Cargar listas geo si faltan al abrir
	React.useEffect(() => {
		if (isOpen) {
			if (!listaRegiones?.length) dispatch(listaRegionesThunk());
			if (!listaProvincias?.length) dispatch(listaProvinciasThunk());
			if (!listaComunas?.length) dispatch(listaComunasThunk());
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

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
		<Modal isOpen={isOpen} setIsOpen={() => handleClose()}>
			<ModalHeader>
				<h3 className='text-lg font-semibold'>
					{isEditing ? 'Editar Subempresa' : 'Nueva Subempresa'}
				</h3>
				<p className='ml-3 mt-1 text-sm text-zinc-500'>
					{isEditing
						? 'Modifica los datos de la subempresa'
						: 'Ingresa los datos de la nueva subempresa'}
				</p>
			</ModalHeader>

			<ModalBody>
				<form onSubmit={formik.handleSubmit} className='space-y-4'>
					{/* Nombre de la subempresa */}
					<div>
						<Label htmlFor='name'>Nombre de la subempresa *</Label>
						<Input
							id='name'
							name='name'
							placeholder='Ej: Sucursal Norte'
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.name && formik.errors.name && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.name}</p>
						)}
					</div>

					{/* RUT de la subempresa */}
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

					{/* Teléfono */}
					<div>
						<Label htmlFor='phone'>Teléfono</Label>
						<Input
							id='phone'
							name='phone'
							placeholder='Ej: +1 234 567 8900'
							value={formik.values.phone}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.phone && formik.errors.phone && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.phone}</p>
						)}
					</div>

					{/* Email de contacto */}
					<div>
						<Label htmlFor='email'>Email de contacto</Label>
						<Input
							id='email'
							name='email'
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

					{/* Sitio web */}
					<div>
						<Label htmlFor='website'>Sitio web</Label>
						<Input
							id='website'
							name='website'
							placeholder='Ej: https://sucursal.empresa.com'
							value={formik.values.website}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
							disabled={formik.isSubmitting}
						/>
						{formik.touched.website && formik.errors.website && (
							<p className='mt-1 text-sm text-red-600'>{formik.errors.website}</p>
						)}
					</div>

					{/* Región / Provincia / Comuna */}
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
										? {
												value: String(formik.values.comuna),
												label: 'Cargando…',
											}
										: null)
								}
								onChange={(opt) =>
									formik.setFieldValue(
										'comuna',
										(opt as TSelectOption | null)?.value || '',
									)
								}
								options={optionsComuna}
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
							onClick={() => formik.handleSubmit()}
							isLoading={formik.isSubmitting}
							isDisable={!formik.isValid}>
							{isEditing ? 'Guardar Cambios' : 'Crear Subempresa'}
						</Button>
					</div>
				</form>
			</ModalBody>
		</Modal>
	);
}
