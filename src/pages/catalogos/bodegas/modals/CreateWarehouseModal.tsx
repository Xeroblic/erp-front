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
import Icon from '@/components/icon/Icon';
import type { ICreateWarehouseForm } from '../types';

const resolveSelectValue = (
	option: TSelectOption | readonly TSelectOption[] | null | undefined,
): number | null => {
	if (!option || Array.isArray(option)) return null;
	const selected = option as TSelectOption;
	return selected.value ? Number(selected.value) : null;
};

interface CreateWarehouseModalProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	form: FormikProps<ICreateWarehouseForm>;
	branchId?: number | null;
}

const CreateWarehouseModal: React.FC<CreateWarehouseModalProps> = ({
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
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
						<Icon icon='HeroTruck' />
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
									value={form.values.name}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.name}
									invalidFeedback={form.errors.name}
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
									value={form.values.code}
									onChange={(e) => {
										e.target.value = e.target.value.toUpperCase();
										form.handleChange(e);
									}}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.code}
									invalidFeedback={form.errors.code}
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
									value={form.values.warehouse_type}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.warehouse_type}
									invalidFeedback={form.errors.warehouse_type}
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
								<p className='mt-1 text-xs text-gray-500'>
									Solo se muestran usuarios con rol{' '}
									<span className='font-semibold'>warehouse-manager</span>
								</p>
							</div>

							<div className='md:col-span-2'>
								<Label htmlFor='description'>Descripción</Label>
								<Textarea
									id='description'
									name='description'
									placeholder='Descripción de la bodega (opcional)'
									value={form.values.description}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
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
									value={form.values.maximum_capacity || ''}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
									isValid={form.isValid}
									isTouched={!!form.touched.maximum_capacity}
									invalidFeedback={form.errors.maximum_capacity as string}
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
									checked={form.values.is_active}
									onChange={form.handleChange}
								/>
								<Checkbox
									id='requires_serial_tracking'
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
								<Label htmlFor='address'>Dirección</Label>
								<Input
									id='address'
									name='address'
									placeholder='Calle Principal 123'
									value={form.values.address || ''}
									onChange={form.handleChange}
									onBlur={form.handleBlur}
								/>
							</div>

							<div>
								<Label htmlFor='commune_id'>Comuna</Label>
								<SelectReact
									id='commune_id'
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
								<Label htmlFor='schedule'>Horario</Label>
								<Input
									id='schedule'
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
						Guardar bodega
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CreateWarehouseModal;
