import React from 'react';
import { useFormikContext } from 'formik';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import type { ProductDetailForm } from '../../types/products.types';
import type { IBrand } from '@/interface/brand.interface';
import { PRODUCT_STATUS_LABELS, PRODUCT_TYPE_LABELS } from '../../constants/products.constant';

interface GeneralTabProps {
	brands: IBrand[];
	brandsLoading: boolean;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ brands, brandsLoading }) => {
	const { values, errors, touched, setFieldValue } = useFormikContext<ProductDetailForm>();

	return (
		<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
			<div className='space-y-1'>
				<label className='text-sm font-medium'>SKU</label>
				<Input
					name='sku'
					placeholder='Ej: PROD-001'
					value={values.sku}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue('sku', event.target.value)
					}
				/>
				{touched.sku && errors.sku && <p className='text-xs text-red-500'>{errors.sku}</p>}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Nombre del producto</label>
				<Input
					name='name'
					placeholder='Nombre descriptivo del producto'
					value={values.name}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
						setFieldValue('name', event.target.value)
					}
				/>

				{/* Mostrar campos básicos de CPU cuando no existe product_type (producto "general") */}
				{!values.product_type && (
					<div className='col-span-1 md:col-span-2 rounded-lg border p-4'>
						<h4 className='mb-4 text-sm font-medium'>Procesador (CPU)</h4>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
							<div className='space-y-1'>
								<label className='text-sm font-medium'>Núcleos</label>
								<input
									name='cpu_cores'
									type='number'
									placeholder='Ej: 6'
									value={values.attributes_json?.cpu?.cores ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = e.target.value === '' ? undefined : Number(e.target.value);
										const next = {
											...(values.attributes_json || {}),
											cpu: {
												...(values.attributes_json?.cpu || {}),
												cores: v,
												},
										};
										setFieldValue('attributes_json', next);
									}}
									className='input'
								/>
							</div>

							<div className='space-y-1'>
								<label className='text-sm font-medium'>Hilos</label>
								<input
									name='cpu_threads'
									type='number'
									placeholder='Ej: 6'
									value={values.attributes_json?.cpu?.threads ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = e.target.value === '' ? undefined : Number(e.target.value);
										const next = {
											...(values.attributes_json || {}),
											cpu: {
												...(values.attributes_json?.cpu || {}),
												threads: v,
												},
										};
										setFieldValue('attributes_json', next);
									}}
									className='input'
								/>
							</div>

							<div className='space-y-1'>
								<label className='text-sm font-medium'>Frecuencia base (MHz)</label>
								<input
									name='cpu_base_clock_mhz'
									type='number'
									placeholder='Ej: 3200'
									value={values.attributes_json?.cpu?.base_clock_mhz ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = e.target.value === '' ? undefined : Number(e.target.value);
										const next = {
											...(values.attributes_json || {}),
											cpu: {
												...(values.attributes_json?.cpu || {}),
												base_clock_mhz: v,
												},
										};
										setFieldValue('attributes_json', next);
									}}
									className='input'
								/>
							</div>

							<div className='space-y-1'>
								<label className='text-sm font-medium'>Frecuencia turbo (MHz)</label>
								<input
									name='cpu_boost_clock_mhz'
									type='number'
									placeholder='Ej: 4100'
									value={values.attributes_json?.cpu?.boost_clock_mhz ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = e.target.value === '' ? undefined : Number(e.target.value);
										const next = {
											...(values.attributes_json || {}),
											cpu: {
												...(values.attributes_json?.cpu || {}),
												boost_clock_mhz: v,
												},
										};
										setFieldValue('attributes_json', next);
									}}
									className='input'
								/>
							</div>
						</div>
					</div>
				)}
				{touched.name && errors.name && (
					<p className='text-xs text-red-500'>{errors.name}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>
					Marca {brandsLoading ? '(Cargando...)' : `(${brands.length} disponibles)`}
				</label>
				<Select
					name='brand_id'
					value={String(values.brand_id || '')}
					onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
						const value = event.target.value;
						setFieldValue('brand_id', value === '' ? '' : Number(value));
					}}
					disabled={brandsLoading}>
					<option value=''>Seleccionar marca</option>
					{brands.map((brand) => (
						<option key={brand.id} value={String(brand.id)}>
							{brand.name}
						</option>
					))}
				</Select>
				{touched.brand_id && errors.brand_id && (
					<p className='text-xs text-red-500'>{errors.brand_id}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Tipo de producto</label>
				<Select
					name='product_type'
					value={values.product_type}
					onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
						setFieldValue('product_type', event.target.value)
					}>
					{Object.entries(PRODUCT_TYPE_LABELS).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</Select>
				{touched.product_type && errors.product_type && (
					<p className='text-xs text-red-500'>{errors.product_type}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Estado</label>
				<Select
					name='is_active'
					value={values.is_active ? 'true' : 'false'}
					onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
						setFieldValue('is_active', event.target.value === 'true')
					}>
					{Object.entries(PRODUCT_STATUS_LABELS).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</Select>
				{touched.is_active && errors.is_active && (
					<p className='text-xs text-red-500'>{errors.is_active}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='flex items-center gap-2'>
					<input
						type='checkbox'
						checked={values.serial_tracking}
						onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
							setFieldValue('serial_tracking', event.target.checked)
						}
						className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
					/>
					<span className='text-sm font-medium'>Seguimiento por número de serie</span>
				</label>
				{touched.serial_tracking && errors.serial_tracking && (
					<p className='text-xs text-red-500'>{errors.serial_tracking}</p>
				)}
			</div>
		</div>
	);
};

export default GeneralTab;
