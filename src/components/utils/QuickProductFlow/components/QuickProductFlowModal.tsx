/**
 * Componente escalable para crear producto rápido
 * Reutilizable en múltiples contextos (IngresoStock, Revisiones técnicas, etc.)
 */
import React from 'react';
import { FormikProps } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Checkbox from '@/components/form/Checkbox';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { IQuickProductForm } from '../types/types';

interface QuickProductFlowModalProps {
	isOpen: boolean;
	onClose: () => void;
	form: FormikProps<IQuickProductForm>;
	isSubmitting: boolean;
	branchId: string;
	brandOptions: TSelectOption[];
	onBrandChange: (brandId: string) => void;
	onCreateBrand: (brandName: string) => Promise<void>;
	title?: string;
	description?: string;
	submitLabel?: string;
	cancelLabel?: string;
}

/**
 * Modal escalable para crear producto rápido con marca
 * Soporta:
 * - Producto express (sin seguimiento)
 * - Producto con seguimiento de serie (con marca obligatoria)
 */
export const QuickProductFlowModal: React.FC<QuickProductFlowModalProps> = ({
	isOpen,
	onClose,
	form,
	isSubmitting,
	branchId,
	brandOptions,
	onBrandChange,
	onCreateBrand,
	title = 'Crear Producto Exprés',
	description = 'Crea un producto rápidamente sin pasar por el catálogo completo.',
	submitLabel = 'Crear y Agregar',
	cancelLabel = 'Cancelar',
}) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<h3 className='text-xl font-bold'>{title}</h3>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					{/* Información de contexto */}
					<div className='rounded-md bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
						{description}
						{branchId && branchId !== '' && (
							<>
								{' '}
								Se asignará automáticamente a la sucursal seleccionada{' '}
								<strong>(ID: {branchId})</strong>.
							</>
						)}
					</div>

					{/* Formulario */}
					<div className='grid grid-cols-1 gap-4'>
						{/* Nombre */}
						<div className='col-span-1'>
							<Label htmlFor='name'>Nombre del producto</Label>
							<Input
								id='name'
								name='name'
								value={form.values.name}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								isValid={form.isValid}
								isTouched={!!form.touched.name}
								invalidFeedback={form.errors.name}
								placeholder='Ej: Laptop Dell Inspiron'
								disabled={isSubmitting}
							/>
						</div>
						{/* SKU */}
						<div className='col-span-1'>
							<Label htmlFor='sku'>SKU (código único)</Label>
							<Input
								id='sku'
								name='sku'
								value={form.values.sku}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								isValid={form.isValid}
								isTouched={!!form.touched.sku}
								invalidFeedback={form.errors.sku}
								placeholder='Ej: SKU-DELL-INS-001'
								disabled={isSubmitting}
							/>
						</div>
						{/* Marca */}
						<div className='col-span-1'>
							<Label htmlFor='brandId'>Marca</Label>
							<SelectReact
								name='brandId'
								placeholder='Seleccionar o crear marca'
								options={brandOptions}
								isCreatable
								isDisabled={isSubmitting}
								value={
									brandOptions.find((opt) => opt.value === form.values.brandId) ||
									null
								}
								onChange={(option) => {
									if (Array.isArray(option)) return;
									const nextValue =
										option && 'value' in option ? String(option.value) : '';
									onBrandChange(nextValue);
								}}
								onCreateOption={(inputValue) => {
									void onCreateBrand(inputValue);
								}}
							/>
							{form.touched.brandId && form.errors.brandId && (
								<p className='mt-1 text-xs text-red-500'>{form.errors.brandId}</p>
							)}
						</div>
						{/* Precio */}
						<div className='col-span-1'>
							<Label htmlFor='price'>Precio</Label>
							<Input
								id='price'
								name='price'
								type='number'
								min={0}
								step={0.01}
								value={form.values.price}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								isValid={form.isValid}
								isTouched={!!form.touched.price}
								invalidFeedback={form.errors.price}
								placeholder='Ej: 1500.00'
								disabled={isSubmitting}
							/>
						</div>
						{/* Seguimiento por Serie */}
						<div className='col-span-1 flex items-center gap-2'>
							<Checkbox
								id='serialTracking'
								name='serialTracking'
								label='Requiere seguimiento por número de serie'
								checked={form.values.serialTracking === '1'}
								onChange={(e) => {
									form.setFieldValue(
										'serialTracking',
										e.target.checked ? '1' : '0',
									);
								}}
								disabled={isSubmitting}
							/>
						</div>{' '}
					</div>
				</div>
			</ModalBody>

			{/* Footer */}
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={onClose} isDisable={isSubmitting}>
					{cancelLabel}
				</Button>
				<Button
					color='blue'
					variant='solid'
					onClick={() => form.handleSubmit()}
					isDisable={isSubmitting}
					isLoading={isSubmitting}>
					{isSubmitting ? 'Creando...' : submitLabel}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
