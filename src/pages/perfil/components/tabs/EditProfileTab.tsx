import { useCallback, useRef, useState } from 'react';
import classNames from 'classnames';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import DateInput from '@/components/form/DateInput';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Validation from '@/components/form/Validation';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Avatar from '@/components/Avatar';
import { ProfileFormik } from '../types';
import { toast } from 'react-toastify';

type Props = {
	formik: ProfileFormik;
	onAvatarUpload: (file: File) => Promise<void> | void;
	avatarUrl?: string | null;
};

const EditProfileTab = ({ formik, onAvatarUpload, avatarUrl }: Props) => {
	const avatarName =
		[formik.values.first_name, formik.values.last_name].filter(Boolean).join(' ') || 'Usuario';

	const [isDraggingFile, setIsDraggingFile] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const compressAndUpload = useCallback(
		async (file: File) => {
			try {
				// Redimensionar en canvas y exportar a WebP sin dependencias externas
				const bitmap = await createImageBitmap(file);
				const maxSize = 400;
				const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
				const canvas = document.createElement('canvas');
				canvas.width = Math.max(1, Math.round(bitmap.width * scale));
				canvas.height = Math.max(1, Math.round(bitmap.height * scale));
				const ctx = canvas.getContext('2d');
				ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
				const blob = await new Promise<Blob>((resolve, reject) => {
					canvas.toBlob(
						(b) => (b ? resolve(b) : reject(new Error('No se pudo generar el blob'))),
						'image/webp',
						0.5,
					);
				});
				const webpFile = new File([blob], 'avatar.webp', { type: 'image/webp' });
				await onAvatarUpload(webpFile);
				toast.success('Avatar comprimido y subido correctamente');
			} catch (error) {
				toast.error('Error al comprimir la imagen');
			}
		},
		[onAvatarUpload],
	);

	const openFilePicker = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileUpload = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			await compressAndUpload(file);
			event.target.value = '';
		},
		[compressAndUpload],
	);

	const handleDrop = useCallback(
		async (event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			setIsDraggingFile(false);

			const file = event.dataTransfer.files?.[0];
			if (file) {
				await compressAndUpload(file);
			}
		},
		[compressAndUpload],
	);

	const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'copy';
		setIsDraggingFile(true);
	}, []);

	const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();

		const related = event.relatedTarget as Node | null;
		if (related && event.currentTarget.contains(related)) return;

		setIsDraggingFile(false);
	}, []);

	const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDraggingFile(true);
	}, []);

	const dropZoneClassName = classNames(
		'flex w-full sm:w-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-all cursor-pointer',
		'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-neutral-900',
		isDraggingFile
			? 'border-primary bg-primary/10 text-primary'
			: 'border-neutral-300 bg-white/60 text-neutral-600 hover:border-primary hover:bg-primary/5 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300',
	);

	return (
		<div className='space-y-8'>
			<header className='space-y-1'>
				<p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary/70'>
					Perfil
				</p>
				<h1 className='text-3xl font-semibold text-neutral-900 dark:text-white'>
					Editar perfil
				</h1>
				<p className='text-sm text-neutral-500 dark:text-neutral-400'>
					Actualiza tu información básica y mantén una imagen de perfil clara. Optimizar
					tu foto ayuda al resto del equipo a reconocerte fácilmente.
				</p>
			</header>

			<section className='rounded-3xl border border-neutral-100/70 bg-white/90 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/80'>
				<div className='grid gap-6 md:grid-cols-[auto,1fr] md:items-center'>
					<div className='flex flex-col items-center gap-4 text-center md:items-start md:text-left'>
						<div
							role='button'
							tabIndex={0}
							aria-label='Ver avatar'
							onClick={() => setIsPreviewOpen(true)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									setIsPreviewOpen(true);
								}
							}}
							className='group relative flex h-32 w-32 items-center justify-center rounded-full shadow-xl ring-4 ring-neutral-50 transition hover:-translate-y-1 dark:ring-neutral-800'>
							<div className='absolute inset-0 overflow-hidden rounded-full border border-white/70 dark:border-neutral-800'>
								<Avatar
									src={avatarUrl ?? undefined}
									name={avatarName}
									className='h-full w-full rounded-full border border-transparent object-cover'
								/>
							</div>
							<span className='pointer-events-none absolute inset-0 rounded-full bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
							<Icon icon='HeroMagnifyingGlassPlus' className='relative text-3xl text-white' />
						</div>
						<div className='space-y-1'>
							<p className='text-base font-semibold text-neutral-900 dark:text-white'>
								{avatarName}
							</p>
							<p className='text-xs text-neutral-500 dark:text-neutral-400'>
								Haz clic o arrastra un archivo para actualizar tu foto.
							</p>
							<button
								type='button'
								onClick={openFilePicker}
								className='inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80'>
								<Icon icon='HeroCamera' className='h-4 w-4' />
								Cambiar imagen
							</button>
						</div>
					</div>

					<div className='w-full space-y-4'>
						{/* <div className='flex flex-wrap gap-2 text-xs'>
							<span className='inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-medium text-primary'>
								WebP automático
							</span>
							<span className='inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200'>
								Tamaño recomendado 400px
							</span>
						</div> */}
						<p className='text-sm text-neutral-600 dark:text-neutral-300'>
							Arrastra una imagen o selecciona un archivo desde tu computador. Se
							convertirá a WebP, se comprimirá y se redimensionará a un tamaño óptimo
							para el sistema.
						</p>
						<input
							ref={fileInputRef}
							id='fileUpload'
							name='fileUpload'
							type='file'
							accept='image/*'
							onChange={handleFileUpload}
							className='sr-only'
						/>
						<div
							role='button'
							tabIndex={0}
							onClick={openFilePicker}
							onKeyDown={(event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									openFilePicker();
								}
							}}
							onDragEnter={handleDragEnter}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							className={dropZoneClassName}>
							<Icon icon='HeroArrowUpTray' className='mb-3 h-10 w-10 text-current' />
							<span className='text-sm font-semibold'>Suelta tu imagen aquí</span>
							<span className='text-xs text-neutral-500 dark:text-neutral-400'>
								o haz clic para explorar tus archivos
							</span>
							<span className='mt-3 text-xs text-neutral-400 dark:text-neutral-500'>
								Formatos sugeridos: JPG, PNG, WEBP (máx. 2&nbsp;MB)
							</span>
						</div>
					</div>
				</div>
			</section>

			{isPreviewOpen && (
				<div className='fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 px-4'>
					<div className='relative flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900'>
						<button
							type='button'
							onClick={() => setIsPreviewOpen(false)}
							className='absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 transition hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'>
							<Icon icon='HeroXMark' className='h-5 w-5' />
						</button>
						<Avatar
							src={avatarUrl ?? undefined}
							name={avatarName}
							className='h-64 w-64 rounded-full border-8 border-primary/40 shadow-xl'
						/>
						<div className='flex flex-wrap justify-center gap-2'>
							<button
								type='button'
								onClick={() => {
									setIsPreviewOpen(false);
									openFilePicker();
								}}
								className='inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90'>
								<Icon icon='HeroCamera' className='h-4 w-4' />
								Cambiar imagen
							</button>
							<button
								type='button'
								onClick={() => setIsPreviewOpen(false)}
								className='inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'>
								<Icon icon='HeroEyeSlash' className='h-4 w-4' />
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}

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
		</div>
	);
};

export default EditProfileTab;
