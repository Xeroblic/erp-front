import React from 'react';
import { useFormikContext } from 'formik';
import type { MultiValue } from 'react-select';
import { Link } from 'react-router-dom';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
import Pages from '@/config/pages.config';
import useCan from '@/hooks/useCan';
import type { ProductDetailForm } from '../../types/products.types';
import type { ICategory } from '@/interface/category.interface';
import type { TSelectOption } from '@/components/form/SelectReact';

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
	// Recepciones y Ajustes exigen `view-product`: sin él, el aviso va sin enlaces.
	const canOpenStockScreens = useCan().has('view-product');

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

			{/*
			 * Sólo lectura: el PATCH del producto descarta `stock` en sucursal y en
			 * filial. El stock vive en una sucursal y se mueve por recepción o ajuste.
			 */}
			<div className='space-y-1'>
				<label className='text-sm font-medium' htmlFor='product-detail-stock'>
					Stock disponible
				</label>
				<Input
					id='product-detail-stock'
					name='stock'
					type='number'
					value={values.stock === '' ? '' : String(values.stock)}
					placeholder='0'
					readOnly
					aria-describedby='product-detail-stock-hint'
					className='cursor-not-allowed opacity-60'
				/>
				<p
					id='product-detail-stock-hint'
					className='text-xs text-neutral-500 dark:text-neutral-400'>
					{values.serial_tracking ? (
						'El stock se calcula automáticamente desde las series aprobadas en revisión técnica.'
					) : (
						<>
							Para cambiarlo, registra una{' '}
							{canOpenStockScreens ? (
								<>
									<Link
										className='font-semibold underline'
										to={Pages.inventory.subPages.recepciones.to}>
										recepción
									</Link>{' '}
									o un{' '}
									<Link
										className='font-semibold underline'
										to={`${Pages.inventory.subPages.ajustesTraslados.to}?tab=ajuste`}>
										ajuste de inventario
									</Link>
								</>
							) : (
								'recepción o un ajuste de inventario'
							)}{' '}
							en la sucursal donde está.
						</>
					)}
				</p>
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
