import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Checkbox from '@/components/form/Checkbox';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import { listaComunasThunk } from '@/store/slices/core/coreSlice';
import type { ICreateWarehouseRequest } from '@/interface/warehouse.interface';
import { useWarehouseManagers } from '../hooks/useWarehouseManagers';

interface CreateWarehouseModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	onSubmit: (data: ICreateWarehouseRequest) => Promise<boolean>;
	loading?: boolean;
	branchId?: number;
}

const validationSchema = Yup.object({
	name: Yup.string()
		.min(3, 'El nombre debe tener al menos 3 caracteres')
		.required('El nombre es obligatorio'),
	code: Yup.string()
		.matches(
			/^[A-Z0-9-]+$/,
			'El código solo puede contener letras mayúsculas, números y guiones',
		)
		.required('El código es obligatorio'),
	warehouse_type: Yup.string().required('El tipo de bodega es obligatorio'),
	maximum_capacity: Yup.number()
		.nullable()
		.min(0, 'La capacidad debe ser un número positivo')
		.transform((value, originalValue) => (originalValue === '' ? null : value)),
	manager_id: Yup.number()
		.nullable()
		.transform((value, originalValue) => (originalValue === '' ? null : value)),
	commune_id: Yup.number()
		.nullable()
		.transform((value, originalValue) => (originalValue === '' ? null : value)),
});

const initialValues: ICreateWarehouseRequest = {
	name: '',
	code: '',
	warehouse_type: 'Secundaria',
	description: '',
	maximum_capacity: null,
	manager_id: null,
	address: '',
	commune_id: null,
	schedule: '',
	is_active: true,
	requires_serial_tracking: false,
};

const CreateWarehouseModal: React.FC<CreateWarehouseModalProps> = ({
	isOpen,
	setIsOpen,
	onSubmit,
	loading = false,
	branchId,
}) => {
	const dispatch = useAppDispatch();
	const { listaComunas } = useAppSelector((state) => state.core);
	const { managerOptions, loading: managersLoading } = useWarehouseManagers(branchId);

	// Cargar comunas al montar el componente
	useEffect(() => {
		if (!listaComunas.length) {
			dispatch(listaComunasThunk());
		}
	}, [dispatch, listaComunas.length]);

	// Transformar comunas a opciones de SelectReact
	const comunaOptions = listaComunas.map((comuna) => ({
		value: comuna.codigo,
		label: comuna.nombre,
	}));

	const handleSubmit = async (
		values: ICreateWarehouseRequest,
		{ setSubmitting, resetForm }: any,
	) => {
		// Limpiar campos opcionales que están vacíos o null
		const cleanedValues: ICreateWarehouseRequest = {
			...values,
		};

		// Eliminar campos opcionales si están vacíos
		if (!cleanedValues.manager_id) delete cleanedValues.manager_id;
		if (!cleanedValues.commune_id) delete cleanedValues.commune_id;
		if (!cleanedValues.maximum_capacity) delete cleanedValues.maximum_capacity;
		if (!cleanedValues.address || cleanedValues.address.trim() === '')
			delete cleanedValues.address;
		if (!cleanedValues.schedule || cleanedValues.schedule.trim() === '')
			delete cleanedValues.schedule;
		if (!cleanedValues.description || cleanedValues.description.trim() === '')
			delete cleanedValues.description;

		const success = await onSubmit(cleanedValues);
		setSubmitting(false);
		if (success) {
			resetForm();
			setIsOpen(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='xl'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
						<span className='text-xl'>🏗️</span>
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							Crear nueva bodega
						</h3>
						<p className='text-sm text-gray-500 dark:text-gray-400'>
							Completa la información para registrar una nueva bodega
						</p>
					</div>
				</div>
			</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}>
				{(formik) => (
					<Form>
						<ModalBody className='space-y-4'>
							<div className='grid gap-4 lg:grid-cols-2'>
								{/* Datos Principales */}
								<Card className='lg:col-span-2'>
								<CardHeader>
									<CardTitle>Datos principales</CardTitle>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='name'>
											Nombre <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='name'
											name='name'
											placeholder='Ej: Bodega Central'
											value={formik.values.name}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={!!formik.touched.name}
											invalidFeedback={formik.errors.name}
										/>
									</div>

									<div>
										<Label htmlFor='code'>
											Código <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='code'
											name='code'
											placeholder='Ej: BOD-001'
											value={formik.values.code}
											onChange={(e) => {
												e.target.value = e.target.value.toUpperCase();
												formik.handleChange(e);
											}}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={!!formik.touched.code}
											invalidFeedback={formik.errors.code}
										/>
									</div>

									<div>
										<Label htmlFor='warehouse_type'>
											Tipo <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='warehouse_type'
											name='warehouse_type'
											placeholder='Ej: Principal, Secundaria'
											value={formik.values.warehouse_type}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={!!formik.touched.warehouse_type}
											invalidFeedback={formik.errors.warehouse_type}
										/>
									</div>

									<div className='md:col-span-2'>
										<Label htmlFor='manager_id'>Encargado de bodega</Label>
										<SelectReact
											id='manager_id'
											name='manager_id'
											options={managerOptions}
											value={
												managerOptions.find(
													(option) =>
														Number(option.value) ===
														Number(formik.values.manager_id ?? Number.NaN),
												) || null
											}
											onChange={(option: any) => {
												const value = option?.value
													? Number(option.value)
													: null;
												formik.setFieldValue('manager_id', value);
											}}
											onBlur={() =>
												formik.setFieldTouched('manager_id', true)
											}
											isClearable
											isDisabled={managersLoading || managerOptions.length === 0}
											isLoading={managersLoading}
											placeholder={
												managersLoading
													? 'Cargando encargados...'
													: managerOptions.length === 0
														? 'No hay encargados disponibles'
														: 'Selecciona un encargado'
											}
										/>
										<p className='mt-1 text-xs text-gray-500'>
											Solo se muestran usuarios con rol{' '}
											<span className='font-semibold'>
												warehouse-manager
											</span>
										</p>
									</div>

									<div className='md:col-span-2'>
										<Label htmlFor='description'>Descripción</Label>
										<Textarea
											id='description'
											name='description'
											placeholder='Descripción de la bodega (opcional)'
											value={formik.values.description}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											rows={2}
										/>
									</div>
								</CardBody>
							</Card>

							{/* Capacidad y Estado */}
							<Card>
								<CardHeader>
									<CardTitle>Capacidad y estado</CardTitle>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div>
										<Label htmlFor='maximum_capacity'>
											Capacidad máxima (unidades)
										</Label>
										<Input
											id='maximum_capacity'
											name='maximum_capacity'
											type='number'
											placeholder='Dejar vacío para capacidad ilimitada'
											value={formik.values.maximum_capacity || ''}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											isValid={formik.isValid}
											isTouched={!!formik.touched.maximum_capacity}
											invalidFeedback={
												formik.errors.maximum_capacity as string
											}
										/>
										<p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
											Si no se especifica, la capacidad será ilimitada
										</p>
									</div>

									<div className='flex items-center gap-6'>
										<Checkbox
											id='is_active'
											name='is_active'
											label='Bodega activa'
											checked={formik.values.is_active}
											onChange={formik.handleChange}
										/>
										<Checkbox
											id='requires_serial_tracking'
											name='requires_serial_tracking'
											label='Requiere seguimiento por serie'
											checked={formik.values.requires_serial_tracking}
											onChange={formik.handleChange}
										/>
									</div>
								</CardBody>
							</Card>

							{/* Ubicación */}
							<Card className='lg:col-span-2'>
								<CardHeader>
									<CardTitle>Ubicación</CardTitle>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div className='md:col-span-2'>
										<Label htmlFor='address'>Dirección</Label>
										<Input
											id='address'
											name='address'
											placeholder='Calle Principal 123'
											value={formik.values.address || ''}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									</div>

									<div>
										<Label htmlFor='commune_id'>Comuna</Label>
										<SelectReact
											id='commune_id'
											name='commune_id'
											options={comunaOptions}
											value={comunaOptions.find(
												(opt) =>
													opt.value === String(formik.values.commune_id),
											)}
											onChange={(option: any) => {
												const value = option?.value
													? Number(option.value)
													: null;
												formik.setFieldValue('commune_id', value);
											}}
											onBlur={() =>
												formik.setFieldTouched('commune_id', true)
											}
											placeholder='Seleccionar comuna'
											isClearable
										/>
									</div>

									<div>
										<Label htmlFor='schedule'>Horario</Label>
										<Input
											id='schedule'
											name='schedule'
											placeholder='Lunes a Viernes 9:00 - 18:00'
											value={formik.values.schedule || ''}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
									</div>
								</CardBody>
							</Card>
							</div>
						</ModalBody>

						<ModalFooter>
							<ModalFooterChild>
								<Button
									color='red'
									variant='outline'
									onClick={() => setIsOpen(false)}
									isDisable={formik.isSubmitting || loading}>
									Cancelar
								</Button>
								<Button
									color='blue'
									variant='solid'
									onClick={formik.submitForm}
									isLoading={formik.isSubmitting || loading}
									isDisable={!formik.isValid || formik.isSubmitting || loading}>
									Guardar bodega
								</Button>
							</ModalFooterChild>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};

export default CreateWarehouseModal;
