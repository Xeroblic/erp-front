import React from 'react';
import { FormikProps } from 'formik';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { IQuickProductForm } from '../types';

interface QuickProductModalProps {
	isOpen: boolean;
	onClose: () => void;
	form: FormikProps<IQuickProductForm>;
	isSubmitting: boolean;
	branchId: string;
	brandOptions: TSelectOption[];
	onBrandChange: (brandId: string) => void;
	onCreateBrand: (brandName: string) => Promise<void>;
}

export const QuickProductModal: React.FC<QuickProductModalProps> = ({
	isOpen,
	onClose,
	form,
	isSubmitting,
	branchId,
	brandOptions,
	onBrandChange,
	onCreateBrand,
}) => {
	// Si el branchId es inválido cuando se abre el modal, podemos mostrar una alerta,
	// pero eso lo manejamos en el submit o antes de abrir.
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose}>
			<ModalHeader>
				<h3 className='text-xl font-bold'>Crear Producto Exprés</h3>
			</ModalHeader>
			<ModalBody>
				<div className='flex flex-col gap-4'>
					{/* Información */}
					<div className='rounded-md bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400'>
						Crea un producto rápidamente sin pasar por el catálogo principal. Se
						asignará automáticamente a la sucursal seleccionada en el panel principal{' '}
						<strong>(ID: {branchId || 'Ninguna'})</strong>.
					</div>

					<div className='grid grid-cols-1 gap-4'>
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
							/>
						</div>

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
							/>
						</div>

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

						<div className='col-span-1'>
							<Label htmlFor='price'>Precio</Label>
							<Input
								id='price'
								name='price'
								type='number'
								min={0}
								value={form.values.price}
								onChange={form.handleChange}
								onBlur={form.handleBlur}
								isValid={form.isValid}
								isTouched={!!form.touched.price}
								invalidFeedback={form.errors.price}
							/>
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button color='zinc' variant='outline' onClick={onClose} isDisable={isSubmitting}>
					Cancelar
				</Button>
				<Button
					color='blue'
					variant='solid'
					onClick={() => form.handleSubmit()}
					isDisable={isSubmitting}>
					{isSubmitting ? 'Creando...' : 'Crear y Agregar'}
				</Button>
			</ModalFooter>
		</Modal>
	);
};
