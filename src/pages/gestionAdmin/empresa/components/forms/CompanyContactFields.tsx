import React from 'react';
import { FormikProps } from 'formik';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Textarea from '@/components/form/Textarea';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';

interface CompanyContactFieldsProps {
	formik: FormikProps<any>;
	optionsRegion: TSelectOption[];
	optionsProvincia: TSelectOption[];
	optionsComuna: TSelectOption[];
	selectedComunaOption: TSelectOption | null;
}

export default function CompanyContactFields({
	formik,
	optionsRegion,
	optionsProvincia,
	optionsComuna,
	selectedComunaOption,
}: CompanyContactFieldsProps) {
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

			<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
				<div>
					<Label htmlFor='region'>Región</Label>
					<SelectReact
						name='region'
						placeholder='Seleccione región'
						value={
							optionsRegion.find((o) => o.value === String(formik.values.region)) ||
							null
						}
						onChange={(opt) =>
							formik.setFieldValue(
								'region',
								(opt as TSelectOption | null)?.value || '',
							)
						}
						options={optionsRegion}
					/>
				</div>

				<div>
					<Label htmlFor='provincia'>Provincia</Label>
					<SelectReact
						name='provincia'
						placeholder='Seleccione provincia'
						value={
							optionsProvincia.find(
								(o) => o.value === String(formik.values.provincia),
							) || null
						}
						onChange={(opt) =>
							formik.setFieldValue(
								'provincia',
								(opt as TSelectOption | null)?.value || '',
							)
						}
						options={optionsProvincia}
					/>
				</div>

				<div>
					<Label htmlFor='comuna'>Comuna</Label>
					<SelectReact
						name='comuna'
						placeholder='Seleccione comuna'
						value={selectedComunaOption}
						onChange={(opt) =>
							formik.setFieldValue(
								'comuna',
								(opt as TSelectOption | null)?.value || '',
							)
						}
						options={optionsComuna}
					/>
				</div>
			</div>

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
