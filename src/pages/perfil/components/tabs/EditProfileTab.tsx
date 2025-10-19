import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import DateInput from '@/components/form/DateInput';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Validation from '@/components/form/Validation';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Avatar from '@/components/Avatar';
import { ProfileFormik } from '../types';

type Props = {
	formik: ProfileFormik;
	onAvatarUpload: (file: File) => Promise<void> | void;
	avatarUrl?: string | null;
};

const EditProfileTab = ({ formik, onAvatarUpload, avatarUrl }: Props) => {
	const avatarName =
		[formik.values.first_name, formik.values.last_name].filter(Boolean).join(' ') || 'Usuario';

	return (
		<>
			<div className='text-4xl font-semibold'>Editar Perfil</div>
			<div className='flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start'>
				<Avatar src={avatarUrl ?? undefined} name={avatarName} className='h-24 w-24' />
				<div className='flex grow items-center'>
					<div className='w-full'>
						<Label
							htmlFor='fileUpload'
							description='Esta permitido JPG o PNG (max 5MB).'>
							Sube una nueva imagen
						</Label>
						<Input
							id='fileUpload'
							name='fileUpload'
							type='file'
							accept='image/png,image/jpeg'
							onChange={async (event) => {
								const file = event.target.files?.[0];
								if (file) {
									await onAvatarUpload(file);
									event.target.value = '';
								}
							}}
						/>
					</div>
				</div>
			</div>
			<div className='grid grid-cols-12 gap-4'>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='email'>Email</Label>
					<FieldWrap firstSuffix={<Icon icon='HeroEnvelope' className='mx-2' />}>
						<Input
							id='email'
							name='email'
							value={formik.values.email || ''}
							readOnly
							autoComplete='email'
						/>
					</FieldWrap>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='rut'>RUT</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.rut}
						invalidFeedback={formik.errors.rut}>
						<Input
							id='rut'
							name='rut'
							value={formik.values.rut || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='first_name'>Primer nombre</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.first_name}
						invalidFeedback={formik.errors.first_name}>
						<Input
							id='first_name'
							name='first_name'
							value={formik.values.first_name || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='second_name'>Segundo nombre</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.second_name}
						invalidFeedback={formik.errors.second_name}>
						<Input
							id='second_name'
							name='second_name'
							value={formik.values.second_name || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='last_name'>Primer apellido</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.last_name}
						invalidFeedback={formik.errors.last_name}>
						<Input
							id='last_name'
							name='last_name'
							value={formik.values.last_name || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='second_last_name'>Segundo apellido</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.second_last_name}
						invalidFeedback={formik.errors.second_last_name}>
						<Input
							id='second_last_name'
							name='second_last_name'
							value={formik.values.second_last_name || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='phone_number'>Celular</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.phone_number}
						invalidFeedback={formik.errors.phone_number}>
						<Input
							id='phone_number'
							name='phone_number'
							value={formik.values.phone_number || ''}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='fecha_nacimiento'>Fecha de nacimiento</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.fecha_nacimiento}
						invalidFeedback={formik.errors.fecha_nacimiento}>
                    <DateInput
                      id='fecha_nacimiento'
                      name='fecha_nacimiento'
                      value={formik.values.fecha_nacimiento || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      maxYear={new Date().getFullYear()}
                      maxDate={new Date()}
                      minYear={1900}
                    />
					</Validation>
				</div>
				<div className='col-span-12 lg:col-span-6'>
					<Label htmlFor='genero'>Genero</Label>
					<RadioGroup isInline>
						{[
							{ value: '0', label: 'No Especificado' },
							{ value: '1', label: 'Masculino' },
							{ value: '2', label: 'Femenino' },
						].map((option) => (
							<Radio
								key={option.value}
								label={option.label}
								name='genero'
								value={option.value}
								selectedValue={formik.values.genero ?? ''}
								onChange={formik.handleChange}
							/>
						))}
					</RadioGroup>
				</div>
			</div>
		</>
	);
};

export default EditProfileTab;
