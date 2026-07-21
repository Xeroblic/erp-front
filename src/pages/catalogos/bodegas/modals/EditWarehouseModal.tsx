import React, { useEffect, useMemo } from 'react';
import { type FormikProps } from 'formik';
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
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import { useAppDispatch, useAppSelector } from '@/store';
import { listaComunasThunk } from '@/store/slices/core/coreSlice';
import { useWarehouseManagers } from '../hooks/useWarehouseManagers';
import type { ICreateWarehouseForm } from '../types';

const resolveSelectValue = (
	option: TSelectOption | readonly TSelectOption[] | null | undefined,
): number | null => {
	if (!option || Array.isArray(option)) return null;
	const selected = option as TSelectOption;
	return selected.value ? Number(selected.value) : null;
};

interface EditWarehouseModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	form: FormikProps<ICreateWarehouseForm>;
	branchId?: number | null;
}

const EditWarehouseModal: React.FC<EditWarehouseModalProps> = ({
	isOpen,
	setIsOpen,
	form,
	branchId,
}) => {
	const dispatch = useAppDispatch();
	const { listaComunas } = useAppSelector((state) => state.core);
	const { managerOptions, loading: managersLoading } = useWarehouseManagers(branchId);

	useEffect(() => {
		if (!listaComunas.length) {
			dispatch(listaComunasThunk());
		}
	}, [dispatch, listaComunas.length]);

	const comunaOptions = useMemo<TSelectOption[]>(
		() => listaComunas.map((comuna) => ({ value: comuna.codigo, label: comuna.nombre })),
		[listaComunas],
	);

	return (
		<Modal isOpen={isOpen} setIsOpen={() => setIsOpen(false)} size='xl'>
			<ModalHeader>Editar Bodega</ModalHeader>

			<ModalBody className='space-y-4'>
				<div className='grid gap-4 lg:grid-cols-2'>
					{/* Información Principal */}
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>Información Principal</CardTitle>
						</CardHeader>
						<CardBody className='grid grid-cols-1 gap-4 md:grid-cols-2'>
							<div>
								<Label htmlFor='edit-name'>
									Nombre <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='edit-name'
									name='name'
									placeholder='Bodega Principal'
									value={form.values.name}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.name}
									invalidFeedback={form.errors.name}
								/>
							</div>

							<div>
								<Label htmlFor='edit-code'>
									Código <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='edit-code'
									name='code'
									placeholder='BDP-001'
									value={form.values.code}
									onChange={(e) => {
										form.setFieldValue('code', e.target.value.toUpperCase());
									}}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.code}
									invalidFeedback={form.errors.code}
								/>
								<div className='mt-1 text-sm text-gray-500'>
									Solo letras mayúsculas, números y guiones
								</div>
							</div>

							<div>
								<Label htmlFor='edit-warehouse_type'>
									Tipo de Bodega <span className='text-red-500'>*</span>
								</Label>
								<Input
									id='edit-warehouse_type'
									name='warehouse_type'
									placeholder='Principal, Secundaria, Tránsito'
									value={form.values.warehouse_type}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.warehouse_type}
									invalidFeedback={form.errors.warehouse_type}
								/>
							</div>

							<div className='md:col-span-2'>
								<Label htmlFor='edit-description'>Descripción</Label>
								<Textarea
									id='edit-description'
									name='description'
									placeholder='Descripción de la bodega'
									value={form.values.description}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									rows={3}
								/>
							</div>

							<div className='md:col-span-2'>
								<Label htmlFor='edit-manager_id'>Encargado de bodega</Label>
								<SelectReact
									id='edit-manager_id'
									name='manager_id'
									options={managerOptions}
									value={
										managerOptions.find(
											(option) =>
												Number(option.value) ===
												Number(form.values.manager_id ?? Number.NaN),
										) || null
									}
									onChange={(option) => {
										const value = resolveSelectValue(option);
										form.setFieldValue('manager_id', value);
									}}
									onBlur={() => form.setFieldTouched('manager_id', true)}
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
								<p className='mt-1 text-sm text-gray-500'>
									Solo se listan usuarios con rol{' '}
									<span className='font-semibold'>warehouse-manager</span>
								</p>
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
								<Label htmlFor='edit-maximum_capacity'>
									Capacidad Máxima
								</Label>
								<Input
									id='edit-maximum_capacity'
									name='maximum_capacity'
									type='number'
									placeholder='1000'
									value={form.values.maximum_capacity ?? ''}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
								/>
								<div className='mt-1 text-sm text-gray-500'>
									Dejar vacío para capacidad ilimitada
								</div>
							</div>

							<div className='space-y-2'>
								<Checkbox
									id='edit-is_active'
									name='is_active'
									label='Bodega activa'
									checked={form.values.is_active}
									onChange={form.handleChange}
								/>
								<Checkbox
									id='edit-requires_serial_tracking'
									name='requires_serial_tracking'
									label='Requiere seguimiento por serie'
									checked={form.values.requires_serial_tracking}
									onChange={form.handleChange}
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
								<Label htmlFor='edit-address'>Dirección</Label>
								<Input
									id='edit-address'
									name='address'
									placeholder='Calle Principal 123'
									value={form.values.address || ''}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
								/>
							</div>

							<div>
								<Label htmlFor='edit-commune_id'>Comuna</Label>
								<SelectReact
									id='edit-commune_id'
									name='commune_id'
									options={comunaOptions}
									value={comunaOptions.find(
										(opt) => opt.value === String(form.values.commune_id),
									)}
									onChange={(option) => {
										const value = resolveSelectValue(option);
										form.setFieldValue('commune_id', value);
									}}
									onBlur={() => form.setFieldTouched('commune_id', true)}
									placeholder='Seleccionar comuna'
									isClearable
								/>
							</div>

							<div>
								<Label htmlFor='edit-schedule'>Horario</Label>
								<Input
									id='edit-schedule'
									name='schedule'
									placeholder='Lunes a Viernes 9:00 - 18:00'
									value={form.values.schedule || ''}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
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
						isDisable={form.isSubmitting}>
						Cancelar
					</Button>
					<Button
						color='emerald'
						variant='outline'
						className='bg-emerald-400/30'
						onClick={form.submitForm}
						isLoading={form.isSubmitting}
						isDisable={!form.isValid || form.isSubmitting}>
						Actualizar bodega
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default EditWarehouseModal;
