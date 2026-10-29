import React, { useMemo } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import Validation from '@/components/form/Validation';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useWarrantyForm } from '../hooks/useWarrantyForm';
import type { WarrantyEntity, WarrantyFormMode } from '../types';
import type { WarrantyStatus } from '@/interface/warranties.interface';
import { warrantyStatusOptions } from '../hooks/useWarranties';
import { formatProductDisplay } from '../utils/warranty.utils';

type WarrantyFormModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	subsidiaryId?: number | null;
	mode: WarrantyFormMode;
	warranty?: WarrantyEntity | null;
	productOptions: TSelectOption[];
	customerOptions: TSelectOption[];
	saleOptions: TSelectOption[];
	onSearchSales: (term?: string) => Promise<TSelectOption[]>;
	onLoadProducts?: () => void;
};

const ensureOption = (
	options: TSelectOption[],
	value?: number | null,
	fallbackLabel?: string,
): TSelectOption | null => {
	if (!value) return null;
	const found = options.find((option) => Number(option.value) === Number(value));
	if (found) return found;
	if (fallbackLabel) {
		return { value: String(value), label: fallbackLabel };
	}
	return null;
};

const WarrantyFormModal: React.FC<WarrantyFormModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	subsidiaryId,
	mode,
	warranty,
	productOptions,
	customerOptions,
	saleOptions,
	onSearchSales,
	onLoadProducts,
}) => {
	const { formik, handleSubmit } = useWarrantyForm({
		subsidiaryId,
		mode,
		warranty,
		onSuccess: () => {
			onSuccess?.();
			onClose();
		},
	});

	const productValue = useMemo(
		() =>
			ensureOption(
				productOptions,
				formik.values.product_id,
				warranty?.product ? formatProductDisplay(warranty.product) : undefined,
			),
		[productOptions, formik.values.product_id, warranty],
	);

	const customerValue = useMemo(
		() =>
			ensureOption(
				customerOptions,
				formik.values.customer_id,
				warranty?.customer?.name
					? `${warranty.customer.name}${warranty.customer.rut ? ` (${warranty.customer.rut})` : ''}`
					: undefined,
			),
		[customerOptions, formik.values.customer_id, warranty],
	);

	const saleValue = useMemo(
		() =>
			ensureOption(
				saleOptions,
				formik.values.sale_id,
				warranty?.sale?.sale_number ? `Venta ${warranty.sale.sale_number}` : undefined,
			),
		[saleOptions, formik.values.sale_id, warranty],
	);

	const statusValue = useMemo(() => {
		if (!formik.values.status) return null;
		return (
			warrantyStatusOptions.find((option) => option.value === formik.values.status) ?? null
		);
	}, [formik.values.status]);

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='xl'>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-semibold text-zinc-900'>
						{mode === 'edit' ? 'Editar garantía' : 'Registrar garantía'}
					</h2>
					<p className='text-sm text-zinc-500'>
						{mode === 'edit'
							? 'Actualiza la información de la garantía seleccionada.'
							: 'Completa los datos para crear una nueva garantía.'}
					</p>
				</div>
			</ModalHeader>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<ModalBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='serial_number'>Número de serie (opcional)</Label>
							<Input
								id='serial_number'
								name='serial_number'
								placeholder='SN001234'
								value={formik.values.serial_number}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
							<p className='mt-1 text-xs text-zinc-400'>
								Si proporcionas un número de serie, se autocompletarán los datos.
							</p>
						</div>
						<div>
							<Label htmlFor='status'>Estado (opcional)</Label>
							<SelectReact
								name='status'
								id='status'
								isClearable
								value={statusValue}
								options={warrantyStatusOptions}
								onChange={(option) => {
									const value = option ? (option as TSelectOption).value : '';
									formik.setFieldValue('status', value as WarrantyStatus | '');
								}}
								onBlur={() => formik.setFieldTouched('status', true)}
							/>
						</div>
					</div>

					<div>
						<Label htmlFor='product_id'>Producto</Label>
						<Validation
							isValid={!formik.errors.product_id}
							isTouched={formik.touched.product_id}
							invalidFeedback={formik.errors.product_id}>
							<SelectReact
								name='product_id'
								id='product_id'
								isClearable
								placeholder='Selecciona un producto'
								value={productValue}
								options={productOptions}
								onFocus={() => {
									void onLoadProducts?.();
								}}
								onChange={(option) =>
									formik.setFieldValue(
										'product_id',
										option ? Number((option as TSelectOption).value) : null,
									)
								}
								onBlur={() => formik.setFieldTouched('product_id', true)}
							/>
						</Validation>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='start_date'>Fecha de inicio</Label>
							<Validation
								isValid={!formik.errors.start_date}
								isTouched={formik.touched.start_date}
								invalidFeedback={formik.errors.start_date}>
								<Input
									type='date'
									id='start_date'
									name='start_date'
									value={formik.values.start_date}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</Validation>
						</div>
						<div>
							<Label htmlFor='end_date'>Fecha de término</Label>
							<Validation
								isValid={!formik.errors.end_date}
								isTouched={formik.touched.end_date}
								invalidFeedback={formik.errors.end_date}>
								<Input
									type='date'
									id='end_date'
									name='end_date'
									value={formik.values.end_date}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</Validation>
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='sale_id'>Venta asociada</Label>
							<SelectReact
								name='sale_id'
								id='sale_id'
								isClearable
								placeholder='Buscar venta'
								value={saleValue}
								options={saleOptions}
								onFocus={() => {
									if (!saleOptions.length) {
										void onSearchSales();
									}
								}}
								onChange={(option) =>
									formik.setFieldValue(
										'sale_id',
										option ? Number((option as TSelectOption).value) : null,
									)
								}
								onInputChange={(term, meta) => {
									if (meta?.action === 'input-change') {
										void onSearchSales(term || '');
									}
								}}
							/>
						</div>
						<div>
							<Label htmlFor='customer_id'>Cliente</Label>
							<SelectReact
								name='customer_id'
								id='customer_id'
								isClearable
								placeholder='Buscar cliente'
								value={customerValue}
								options={customerOptions}
								onChange={(option) =>
									formik.setFieldValue(
										'customer_id',
										option ? Number((option as TSelectOption).value) : null,
									)
								}
							/>
						</div>
					</div>

					<div>
						<Label htmlFor='notes'>Notas</Label>
						<Textarea
							id='notes'
							name='notes'
							rows={3}
							placeholder='Comentarios adicionales sobre la garantía'
							value={formik.values.notes}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</div>
				</ModalBody>
				<ModalFooter className='flex items-center justify-end space-x-2'>
					<Button variant='outline' onClick={onClose} type='button'>
						Cancelar
					</Button>
					<Button type='submit' color='emerald' isLoading={formik.isSubmitting}>
						{mode === 'edit' ? 'Guardar cambios' : 'Crear garantía'}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
};

export default WarrantyFormModal;
