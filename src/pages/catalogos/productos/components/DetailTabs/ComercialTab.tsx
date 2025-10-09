import React from 'react';
import { useFormikContext } from 'formik';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';
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
	const { values, errors, touched, setFieldValue } = useFormikContext<ProductDetailForm>();

	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
			<div className='space-y-1'>
				<label className='text-sm font-medium'>Precio base</label>
				<Input
					name='price'
					type='number'
					placeholder='0.00'
					value={values.price === '' ? '' : String(values.price)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue(
							'price',
							event.target.value === '' ? '' : Number(event.target.value),
						)
					}
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
					value={values.offer_price === '' ? '' : String(values.offer_price)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue(
							'offer_price',
							event.target.value === '' ? '' : Number(event.target.value),
						)
					}
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
					value={values.cost === '' ? '' : String(values.cost)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue(
							'cost',
							event.target.value === '' ? '' : Number(event.target.value),
						)
					}
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
					value={values.warranty_months === '' ? '' : String(values.warranty_months)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue(
							'warranty_months',
							event.target.value === '' ? '' : Number(event.target.value),
						)
					}
				/>
				{touched.warranty_months && errors.warranty_months && (
					<p className='text-xs text-red-500'>{errors.warranty_months}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Stock disponible</label>
				<Input
					name='stock'
					type='number'
					placeholder='0'
					value={values.stock === '' ? '' : String(values.stock)}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue(
							'stock',
							event.target.value === '' ? '' : Number(event.target.value),
						)
					}
				/>
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
