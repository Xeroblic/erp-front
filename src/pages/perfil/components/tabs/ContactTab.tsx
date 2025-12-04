import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { ProfileFormik } from '../types';

type Props = {
	formik: ProfileFormik;
	regionOptions: TSelectOption[];
	provinceOptions: TSelectOption[];
	comunaOptions: TSelectOption[];
};

const ContactTab = ({ formik, regionOptions, provinceOptions, comunaOptions }: Props) => {
	return (
		<>
			<div className='text-4xl font-semibold'>Contacto</div>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12'>
					<Label htmlFor='direccion'>Direccion</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.direccion}
						invalidFeedback={formik.errors.direccion}>
						<Input
							id='direccion'
							name='direccion'
							value={formik.values.direccion || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12'>
					<Label htmlFor='region'>Region</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.region}
						invalidFeedback={formik.errors.region}>
						<SelectReact
							id='region'
							name='region'
							isMulti={false}
							placeholder='Region'
							options={regionOptions}
							value={(() => {
								const v = formik.values.region;
								const found = regionOptions.find((o) => o.value === v) || null;
								return found || (v ? { value: v, label: String(v) } : null);
							})()}
							onBlur={formik.handleBlur}
							onChange={(option) =>
								formik.setFieldValue(
									'region',
									(option as TSelectOption | null)?.value || '',
								)
							}
						/>
					</Validation>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12'>
					<Label htmlFor='provincia'>Provincia</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.provincia}
						invalidFeedback={formik.errors.provincia}>
						<SelectReact
							id='provincia'
							name='provincia'
							isMulti={false}
							placeholder='Provincia'
							options={provinceOptions}
							value={(() => {
								const v = formik.values.provincia;
								const found = provinceOptions.find((o) => o.value === v) || null;
								return found || (v ? { value: v, label: String(v) } : null);
							})()}
							onBlur={formik.handleBlur}
							onChange={(option) =>
								formik.setFieldValue(
									'provincia',
									(option as TSelectOption | null)?.value || '',
								)
							}
						/>
					</Validation>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12'>
					<Label htmlFor='comuna'>Comuna</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.comuna}
						invalidFeedback={formik.errors.comuna}>
						<SelectReact
							id='comuna'
							name='comuna'
							isMulti={false}
							placeholder='Comuna'
							options={comunaOptions}
							value={(() => {
								const v = formik.values.comuna;
								const found = comunaOptions.find((o) => o.value === v) || null;
								return found || (v ? { value: v, label: String(v) } : null);
							})()}
							onBlur={formik.handleBlur}
							onChange={(option) =>
								formik.setFieldValue(
									'comuna',
									(option as TSelectOption | null)?.value || '',
								)
							}
						/>
					</Validation>
				</div>
			</div>
		</>
	);
};

export default ContactTab;
