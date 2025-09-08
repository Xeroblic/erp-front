import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/store';
import { createSucursal, updateSucursal } from '@/store/slices/sucursales/sucursalesSlice';
import { fetchMisSubsidiarias } from '@/store/slices/subempresa/subEmpresaSlice';
import { toast } from 'react-toastify';
import { unwrapResult } from '@reduxjs/toolkit';
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
	manager_name: Yup.string()
		.nullable()
		.max(100, 'El nombre del encargado no puede exceder 100 caracteres'),
	manager_phone: Yup.string()
		.nullable()
		.matches(/^[\d\s\-\+\(\)]*$/, 'Formato de teléfono inválido')
		.max(20, 'El teléfono no puede exceder 20 caracteres'),
	manager_email: Yup.string()
		.nullable()
		.email('Formato de email inválido')
		.max(100, 'El email no puede exceder 100 caracteres'),
});

export default function SucursalModal({
	isOpen,
	onClose,
	sucursal,
	onSuccess,
}: SucursalModalProps) {
	const dispatch = useAppDispatch();
	const subsidiaries = useAppSelector((s) => s.subEmpresa.lista);
	const isEditing = Boolean(sucursal);

	// Cargar subsidiarias al abrir el modal
	useEffect(() => {
		if (isOpen) {
			dispatch(fetchMisSubsidiarias());
		}
	}, [isOpen, dispatch]);

	const formik = useFormik({
		initialValues: {
			name: '',
			subsidiary_id: '',
			rut: '',
			address: '',
			phone: '',
			email: '',
			manager_name: '',
			manager_phone: '',
			manager_email: '',
		},
		validationSchema,
		onSubmit: async (values) => {
			try {
				// Limpiar valores vacíos
				const sucursalData = {
					name: values.name.trim(),
					subsidiary_id: Number(values.subsidiary_id),
					rut: values.rut.trim() || undefined,
					address: values.address.trim() || undefined,
					phone: values.phone.trim() || undefined,
					email: values.email.trim() || undefined,
					manager_name: values.manager_name.trim() || undefined,
					manager_phone: values.manager_phone.trim() || undefined,
					manager_email: values.manager_email.trim() || undefined,
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
					name: sucursal.name || '',
					subsidiary_id: sucursal.subsidiary_id?.toString() || '',
					rut: sucursal.rut || '',
					address: sucursal.address || '',
					phone: sucursal.phone || '',
					email: sucursal.email || '',
					manager_name: sucursal.manager_name || '',
					manager_phone: sucursal.manager_phone || '',
					manager_email: sucursal.manager_email || '',
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
		label: sub.name,
	}));

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
									subsidiaryOptions.find(
										(opt) => opt.value === formik.values.subsidiary_id,
									) || null
								}
								onChange={(selectedOption) => {
									const option = selectedOption as TSelectOption | null;
									formik.setFieldValue('subsidiary_id', option?.value || '');
								}}
								onBlur={() => formik.setFieldTouched('subsidiary_id', true)}
								isDisabled={formik.isSubmitting}
								options={subsidiaryOptions}
								className='react-select-container'
								classNamePrefix='react-select'
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
						<h3 className='border-b pb-2 text-lg font-medium'>Encargado de Sucursal</h3>

						{/* Nombre del Encargado */}
						<div>
							<Label htmlFor='manager_name'>Nombre del Encargado</Label>
							<Input
								id='manager_name'
								name='manager_name'
								placeholder='Ej: Juan Pérez'
								value={formik.values.manager_name}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
							{formik.touched.manager_name && formik.errors.manager_name && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.manager_name}
								</p>
							)}
						</div>

						<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							{/* Teléfono del Encargado */}
							<div>
								<Label htmlFor='manager_phone'>Teléfono del Encargado</Label>
								<Input
									id='manager_phone'
									name='manager_phone'
									placeholder='Ej: +56 9 8765 4321'
									value={formik.values.manager_phone}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.manager_phone && formik.errors.manager_phone && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.manager_phone}
									</p>
								)}
							</div>

							{/* Email del Encargado */}
							<div>
								<Label htmlFor='manager_email'>Email del Encargado</Label>
								<Input
									id='manager_email'
									name='manager_email'
									type='email'
									placeholder='Ej: juan.perez@empresa.com'
									value={formik.values.manager_email}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
								{formik.touched.manager_email && formik.errors.manager_email && (
									<p className='mt-1 text-sm text-red-600'>
										{formik.errors.manager_email}
									</p>
								)}
							</div>
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
