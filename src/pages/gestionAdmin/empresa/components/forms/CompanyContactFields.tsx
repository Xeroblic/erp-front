import React from 'react';
import { FormikProps } from 'formik';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import { SelectComune } from '@/components/utils/selects/SelectComune';

interface CompanyContactFieldsProps {
	formik: FormikProps<any>;
}

export default function CompanyContactFields({ formik }: CompanyContactFieldsProps) {
	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				<div>
					<Label htmlFor='company_phone'>Teléfono Principal</Label>
					<Input
						id='company_phone'
						name='company_phone'
						type='tel'
						value={formik.values.company_phone}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						placeholder='+56 9 1234 5678'
					/>
					{formik.touched.company_phone &&
						formik.errors.company_phone &&
						typeof formik.errors.company_phone === 'string' && (
							<p className='mt-1 text-sm text-red-600'>
								{formik.errors.company_phone}
							</p>
						)}
				</div>

				<div>
					<Label htmlFor='contact_email'>Email de Contacto *</Label>
					<Input
						id='contact_email'
						name='contact_email'
						type='email'
						value={formik.values.contact_email}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						placeholder='contacto@empresa.cl'
					/>
					{formik.touched.contact_email &&
						formik.errors.contact_email &&
						typeof formik.errors.contact_email === 'string' && (
							<p className='mt-1 text-sm text-red-600'>
								{formik.errors.contact_email}
							</p>
						)}
				</div>
			</div>

			<div>
				<Label htmlFor='company_address'>Dirección *</Label>
				<Textarea
					id='company_address'
					name='company_address'
					value={formik.values.company_address}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					placeholder='Dirección completa de la empresa'
					rows={2}
				/>
				{formik.touched.company_address &&
					formik.errors.company_address &&
					typeof formik.errors.company_address === 'string' && (
						<p className='mt-1 text-sm text-red-600'>{formik.errors.company_address}</p>
					)}
			</div>

			<SelectComune
				name='comuna'
				label='Comuna'
				placeholder='Seleccione comuna'
				isRequired
				value={formik.values.comuna || formik.values.commune_id?.toString()}
				error={
					formik.touched.comuna && typeof formik.errors.comuna === 'string'
						? formik.errors.comuna
						: undefined
				}
				disabled={formik.isSubmitting}
				onChange={(val, data) => {
					formik.setFieldValue('comuna', val);
					formik.setFieldValue('commune_id', val ? Number(val) : undefined);
					if (data) {
						formik.setFieldValue('provincia', data.province_id);
						formik.setFieldValue('region', data.region_id);
					} else {
						formik.setFieldValue('provincia', '');
						formik.setFieldValue('region', '');
					}
				}}
			/>

			<div>
				<Label htmlFor='representative_name'>Representante Legal *</Label>
				<Input
					id='representative_name'
					name='representative_name'
					value={formik.values.representative_name}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					placeholder='Nombre completo del representante legal'
				/>
				{formik.touched.representative_name &&
					formik.errors.representative_name &&
					typeof formik.errors.representative_name === 'string' && (
						<p className='mt-1 text-sm text-red-600'>
							{formik.errors.representative_name}
						</p>
					)}
			</div>
		</div>
	);
}
