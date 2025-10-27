import React from 'react';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import { FormikProps } from 'formik';

interface CompanyGeneralFieldsProps {
	formik: FormikProps<any>;
}

export default function CompanyGeneralFields({ formik }: CompanyGeneralFieldsProps) {
	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
				<div>
					<Label htmlFor='company_name'>Nombre Comercial *</Label>
					<Input
						id='company_name'
						name='company_name'
						value={formik.values.company_name}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						placeholder='Ej: EcoTech SPA'
					/>
					{formik.touched.company_name && formik.errors.company_name && typeof formik.errors.company_name === 'string' && (
						<p className='mt-1 text-sm text-red-600'>{formik.errors.company_name}</p>
					)}
				</div>

				<div>
					<Label htmlFor='legal_name'>Razón Social *</Label>
					<Input
						id='legal_name'
						name='legal_name'
						value={formik.values.legal_name}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						placeholder='Ej: EcoTech Soluciones Tecnológicas SpA'
					/>
					{formik.touched.legal_name && formik.errors.legal_name && typeof formik.errors.legal_name === 'string' && (
						<p className='mt-1 text-sm text-red-600'>{formik.errors.legal_name}</p>
					)}
				</div>

				<div>
					<Label htmlFor='company_rut'>RUT *</Label>
					<Input
						id='company_rut'
						name='company_rut'
						value={formik.values.company_rut}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						placeholder='Ej: 76.795.560-9'
					/>
					{formik.touched.company_rut && formik.errors.company_rut && typeof formik.errors.company_rut === 'string' && (
						<p className='mt-1 text-sm text-red-600'>{formik.errors.company_rut}</p>
					)}
				</div>

				<div>
					<Label htmlFor='company_type'>Tipo de Empresa *</Label>
					<Input
						id='company_type'
						name='company_type'
						value={formik.values.company_type}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						placeholder='Ej: SPA, LTDA, SA'
					/>
					{formik.touched.company_type && formik.errors.company_type && typeof formik.errors.company_type === 'string' && (
						<p className='mt-1 text-sm text-red-600'>{formik.errors.company_type}</p>
					)}
				</div>
			</div>

			<div>
				<Label htmlFor='business_activity'>Actividad Comercial *</Label>
				<Textarea
					id='business_activity'
					name='business_activity'
					value={formik.values.business_activity}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					placeholder='Describe la actividad principal de la empresa'
					rows={3}
				/>
				{formik.touched.business_activity && formik.errors.business_activity && typeof formik.errors.business_activity === 'string' && (
					<p className='mt-1 text-sm text-red-600'>{formik.errors.business_activity}</p>
				)}
			</div>

			<div>
				<Label htmlFor='company_website'>Sitio Web</Label>
				<Input
					id='company_website'
					name='company_website'
					type='url'
					value={formik.values.company_website}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					placeholder='https://www.ejemplo.cl'
				/>
				{formik.touched.company_website && formik.errors.company_website && typeof formik.errors.company_website === 'string' && (
					<p className='mt-1 text-sm text-red-600'>{formik.errors.company_website}</p>
				)}
			</div>
		</div>
	);
}
