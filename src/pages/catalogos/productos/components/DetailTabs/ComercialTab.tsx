import React from 'react';
import { useFormikContext } from 'formik';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import { toast } from 'react-toastify';
import type { ProductDetailForm } from '../../types/products.types';
import type { ICategory } from '@/interface/category.interface';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { MultiValue } from 'react-select';

interface ComercialTabProps {
	categories: ICategory[];
	categoriesLoading: boolean;
	categoryOptions: TSelectOption[];
}

const ComercialTab: React.FC<ComercialTabProps> = ({
	categories,
	categoriesLoading,
	categoryOptions,
}) => {
	const { values, errors, touched, setFieldValue, setFieldTouched } =
		useFormikContext<ProductDetailForm>();

	// Validar que el número no exceda el límite de la BD (NUMERIC(14,2))
	const handlePriceChange = (fieldName: string, value: string) => {
		setFieldTouched(fieldName, true); // Marcar como touched siempre

		if (value === '') {
			setFieldValue(fieldName, '');
			return;
		}

		const numValue = Number(value);

		// Límite: 999,999,999,999.99 (12 dígitos enteros + 2 decimales)
		if (numValue > 999999999999.99) {
			return; // No permite escribir más
		}

		// Validar máximo 2 decimales
		const decimalParts = value.split('.');
		if (decimalParts.length > 1 && decimalParts[1].length > 2) {
			return; // No permite más de 2 decimales
		}

		setFieldValue(fieldName, numValue);
	};

	// Validar números enteros con límite
	const handleIntegerChange = (fieldName: string, value: string, max: number) => {
		setFieldTouched(fieldName, true); // Marcar como touched siempre

		if (value === '') {
			setFieldValue(fieldName, '');
			return;
		}

		const numValue = Number(value);

		if (numValue > max) {
			return; // No permite escribir más
		}

		// Solo enteros
		if (!Number.isInteger(numValue)) {
			return;
		}

		setFieldValue(fieldName, numValue);
	};

	// Handler específico para stock con validación de serial_tracking
	const handleStockChange = (value: string) => {
		// Si el producto usa tracking por serie, bloquear edición
		if (values.serial_tracking) {
			toast.warning(
				'⚠️ No se puede modificar el stock manualmente. Este producto usa tracking por serie y el stock se calcula automáticamente.',
				{ autoClose: 5000 },
			);
			return;
		}

		// Si no tiene tracking, permitir edición normal
		handleIntegerChange('stock', value, 999999999);
	};

	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
			<div className='space-y-1'>
				<label className='text-sm font-medium'>Precio base</label>
				<Input
					name='price'
					type='number'
					placeholder='0.00'
					min='0'
					max='999999999999.99'
					step='0.01'
					value={values.price === '' ? '' : String(values.price)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						handlePriceChange('price', event.target.value)
					}
					isValid={!errors.price}
					isTouched={touched.price}
					invalidFeedback={errors.price}
				/>
				{touched.price && errors.price && (
					<p className='text-xs text-red-500'>{errors.price}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Precio oferta</label>
				<Input
					name='offer_price'
					type='number'
					placeholder='0.00'
					min='0'
					max='999999999999.99'
					step='0.01'
					value={values.offer_price === '' ? '' : String(values.offer_price)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						handlePriceChange('offer_price', event.target.value)
					}
					isValid={!errors.offer_price}
					isTouched={touched.offer_price}
					invalidFeedback={errors.offer_price}
				/>
				{touched.offer_price && errors.offer_price && (
					<p className='text-xs text-red-500'>{errors.offer_price}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Costo</label>
				<Input
					name='cost'
					type='number'
					placeholder='0.00'
					min='0'
					max='999999999999.99'
					step='0.01'
					value={values.cost === '' ? '' : String(values.cost)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						handlePriceChange('cost', event.target.value)
					}
					isValid={!errors.cost}
					isTouched={touched.cost}
					invalidFeedback={errors.cost}
				/>
				{touched.cost && errors.cost && (
					<p className='text-xs text-red-500'>{errors.cost}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Garantía (meses)</label>
				<Input
					name='warranty_months'
					type='number'
					placeholder='12'
					min='0'
					max='999'
					step='1'
					value={values.warranty_months === '' ? '' : String(values.warranty_months)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						handleIntegerChange('warranty_months', event.target.value, 999)
					}
					isValid={!errors.warranty_months}
					isTouched={touched.warranty_months}
					invalidFeedback={errors.warranty_months}
				/>
				{touched.warranty_months && errors.warranty_months && (
					<p className='text-xs text-red-500'>{errors.warranty_months}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>
					Stock disponible
					{values.serial_tracking && (
						<span className='ml-2 text-xs text-amber-500'>
							(Solo lectura - calculado por series)
						</span>
					)}
				</label>
				<Input
					name='stock'
					type='number'
					placeholder='0'
					min='0'
					max='999999999'
					step='1'
					value={values.stock === '' ? '' : String(values.stock)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						handleStockChange(event.target.value)
					}
					disabled={values.serial_tracking}
					isValid={!errors.stock}
					isTouched={touched.stock}
					invalidFeedback={errors.stock}
					className={values.serial_tracking ? 'cursor-not-allowed opacity-60' : ''}
				/>
				{values.serial_tracking && (
					<p className='text-xs text-amber-600 dark:text-amber-400'>
						El stock se calcula automáticamente desde las series aprobadas en
						revisión técnica
					</p>
				)}
				{touched.stock && errors.stock && (
					<p className='text-xs text-red-500'>{errors.stock}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Categorías</label>
				<SelectReact
					name='category_ids'
					placeholder='Seleccionar categorías...'
					options={categoryOptions}
					value={categoryOptions.filter((option) =>
						values.category_ids.includes(Number(option.value)),
					)}
					onChange={(selectedOptions) => {
						const categoryIds = selectedOptions
							? (selectedOptions as TSelectOption[]).map((option) =>
									Number(option.value),
								)
							: [];
						setFieldValue('category_ids', categoryIds);
					}}
					isMulti
					isLoading={categoriesLoading}
					isDisabled={categoriesLoading || !categories.length}
				/>
				{touched.category_ids && errors.category_ids && (
					<p className='text-xs text-red-500'>{errors.category_ids}</p>
				)}
			</div>
		</div>
	);
};

export default ComercialTab;
