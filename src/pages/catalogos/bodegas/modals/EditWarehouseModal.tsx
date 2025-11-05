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
import type { IWarehouse, IUpdateWarehouseRequest } from '@/interface/warehouse.interface';

interface EditWarehouseModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	warehouse: IWarehouse | null;
	onSubmit: (id: number, data: IUpdateWarehouseRequest) => Promise<boolean>;
	loading?: boolean;
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

const EditWarehouseModal: React.FC<EditWarehouseModalProps> = ({
	isOpen,
	setIsOpen,
	warehouse,
	onSubmit,
	loading = false,
}) => {
	const dispatch = useAppDispatch();
	const { listaComunas } = useAppSelector((state) => state.core);

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

	const handleSubmit = async (values: IUpdateWarehouseRequest, { setSubmitting }: any) => {
		if (!warehouse) return;

		// Limpiar campos opcionales que están vacíos o null
		const cleanedValues: IUpdateWarehouseRequest = {
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

		const success = await onSubmit(warehouse.id, cleanedValues);
		setSubmitting(false);
		if (success) {
			setIsOpen(false);
		}
	};

	if (!warehouse) return null;

	const initialValues: IUpdateWarehouseRequest = {
		name: warehouse.name || '',
		code: warehouse.code || '',
		warehouse_type: warehouse.warehouse_type || 'Secundaria',
		description: warehouse.description || '',
		maximum_capacity: warehouse.maximum_capacity,
		manager_id: warehouse.manager_id,
		address: warehouse.address || '',
		commune_id: warehouse.commune_id,
		schedule: warehouse.schedule || '',
		is_active: warehouse.is_active !== undefined ? warehouse.is_active : true,
		requires_serial_tracking: warehouse.requires_serial_tracking || false,
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='xl'>
			<ModalHeader>Editar Bodega</ModalHeader>

			<Formik
				initialValues={initialValues}
				validationSchema={validationSchema}
				onSubmit={handleSubmit}
				enableReinitialize>
				{(formik) => (
					<Form>
						<ModalBody className='space-y-4'>
							{/* Información Principal */}
							<Card>
								<CardHeader>
									<CardTitle>Información Principal</CardTitle>
								</CardHeader>
								<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
									<div>
										<Label htmlFor='name'>
											Nombre <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='name'
											name='name'
											placeholder='Bodega Principal'
											value={formik.values.name}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.name && formik.errors.name && (
											<div className='mt-1 text-sm text-red-500'>
												{formik.errors.name}
											</div>
										)}
									</div>

									<div>
										<Label htmlFor='code'>
											Código <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='code'
											name='code'
											placeholder='BDP-001'
											value={formik.values.code}
											onChange={(e) => {
												const upperValue = e.target.value.toUpperCase();
												formik.setFieldValue('code', upperValue);
											}}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.code && formik.errors.code && (
											<div className='mt-1 text-sm text-red-500'>
												{formik.errors.code}
											</div>
										)}
										<div className='mt-1 text-sm text-gray-500'>
											Solo letras mayúsculas, números y guiones
										</div>
									</div>

									<div>
										<Label htmlFor='warehouse_type'>
											Tipo de Bodega <span className='text-red-500'>*</span>
										</Label>
										<Input
											id='warehouse_type'
											name='warehouse_type'
											placeholder='Principal, Secundaria, Tránsito'
											value={formik.values.warehouse_type}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.warehouse_type &&
											formik.errors.warehouse_type && (
												<div className='mt-1 text-sm text-red-500'>
													{formik.errors.warehouse_type}
												</div>
											)}
									</div>

									<div className='md:col-span-2'>
										<Label htmlFor='description'>Descripción</Label>
										<Textarea
											id='description'
											name='description'
											placeholder='Descripción de la bodega'
											value={formik.values.description}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											rows={3}
										/>
									</div>
								</CardBody>
							</Card>

							{/* Capacidad y Estado */}
							<Card>
								<CardHeader>
									<CardTitle>Capacidad y Estado</CardTitle>
								</CardHeader>
								<CardBody className='space-y-4'>
									<div>
										<Label htmlFor='maximum_capacity'>Capacidad Máxima</Label>
										<Input
											id='maximum_capacity'
											name='maximum_capacity'
											type='number'
											placeholder='1000'
											value={formik.values.maximum_capacity ?? ''}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										<div className='mt-1 text-sm text-gray-500'>
											Dejar vacío para capacidad ilimitada
										</div>
									</div>

									<div className='space-y-2'>
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
							<Card>
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
									Actualizar bodega
								</Button>
							</ModalFooterChild>
						</ModalFooter>
					</Form>
				)}
			</Formik>
		</Modal>
	);
};

export default EditWarehouseModal;
