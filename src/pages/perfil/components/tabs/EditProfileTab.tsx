import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import DateInput from '@/components/form/DateInput';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Validation from '@/components/form/Validation';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Avatar from '@/components/Avatar';
import { ProfileFormik } from '../types';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-toastify';

type Props = {
	formik: ProfileFormik;
	onAvatarUpload: (file: File) => Promise<void> | void;
	avatarUrl?: string | null;
};

const EditProfileTab = ({ formik, onAvatarUpload, avatarUrl }: Props) => {
	const avatarName =
		[formik.values.first_name, formik.values.last_name].filter(Boolean).join(' ') || 'Usuario';

		const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;
		
			try {
				// 🧽 Paso 1: compresión base con menos calidad y resolución
				const compressed = await imageCompression(file, {
					maxSizeMB: 0.3, // 300 KB máximo
					maxWidthOrHeight: 400, // resolución aún más baja
					useWebWorker: true,
					initialQuality: 0.4, // súper comprimido
				});
		
				// 🔄 Paso 2: convertir a WebP de nuevo con compresión extra
				const bitmap = await createImageBitmap(compressed);
				const canvas = document.createElement('canvas');
		
				// ajustar tamaño para que no se pase de resolución
				canvas.width = Math.min(bitmap.width, 400);
				canvas.height = Math.min(bitmap.height, 400);
		
				const ctx = canvas.getContext('2d');
				ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		
				const blob = await new Promise<Blob>((resolve, reject) => {
					canvas.toBlob(
						(b) => (b ? resolve(b) : reject('No se pudo generar el blob')),
						'image/webp',
						0.5 // calidad final 50%
					);
				});
		
				const webpFile = new File([blob], 'avatar.webp', { type: 'image/webp' });
		
				console.log('✅ Archivo final:', webpFile.name, webpFile.size / 1024, 'KB');
		
				await onAvatarUpload(webpFile);
				event.target.value = '';
				toast.success('Avatar comprimido y subido correctamente 🚀');
			} catch (error) {
				console.error('Error al comprimir la imagen:', error);
				toast.error('Error al comprimir la imagen 😭');
			}
		};
		

	return (
		<>
			<div className='text-4xl font-semibold'>Editar Perfil</div>
			<div className='flex flex-col sm:flex-row items-center gap-6 w-full'>
				<div className='relative group'>
					<Avatar
						src={avatarUrl ?? undefined}
						name={avatarName}
						className='h-28 w-28 border-4 border-primary/40 rounded-full shadow-lg transition-transform group-hover:scale-105 group-hover:border-primary'
					/>
					<label
						htmlFor='fileUpload'
						className='absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
						<Icon icon='HeroCamera' className='text-white text-3xl' />
					</label>
				</div>

				<div className='w-full sm:w-auto'>
					<p className='text-sm text-gray-500 mb-2'>
						Puedes subir cualquier archivo (se convertirá a WebP y comprimirá automáticamente)
					</p>
					<Input
						id='fileUpload'
						name='fileUpload'
						type='file'
						accept='*/*'
						onChange={handleFileUpload}
						className='cursor-pointer'
					/>
				</div>
			</div>

			<div className='mt-6 grid grid-cols-12 gap-4'>
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
