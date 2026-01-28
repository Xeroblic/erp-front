import { useCallback, useEffect, useId, useRef, useState } from 'react';
import classNames from 'classnames';
import { toast } from 'react-toastify';
import gsap from 'gsap';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import DateInput from '@/components/form/DateInput';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Validation from '@/components/form/Validation';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Button from '@/components/ui/Button';
import { ProfileFormik } from '../types';

type Props = {
	formik: ProfileFormik;
	onAvatarUpload: (file: File) => Promise<void> | void;
	avatarUrl?: string | null;
};

const EditProfileTab = ({ formik, onAvatarUpload, avatarUrl }: Props) => {
	const formRef = useRef<HTMLDivElement>(null);
	const [isDraggingFile, setIsDraggingFile] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const dragDepthRef = useRef(0);

	// Animación stagger de campos del formulario
	useEffect(() => {
		if (!formRef.current) return;

		const fields = formRef.current.querySelectorAll('.form-field');
		if (fields.length === 0) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				fields,
				{ opacity: 0, y: 15 },
				{
					opacity: 1,
					y: 0,
					duration: 0.4,
					stagger: 0.05,
					ease: 'power2.out',
				},
			);
		}, formRef);

		return () => ctx.revert();
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const hasFiles = (event: DragEvent) =>
			Array.from(event.dataTransfer?.types ?? []).includes('Files');

		const onDragEnter = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current += 1;
			setIsDraggingFile(true);
		};

		const onDragOver = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'copy';
			}
			setIsDraggingFile(true);
		};

		const onDragLeave = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
			if (dragDepthRef.current === 0) {
				setIsDraggingFile(false);
			}
		};

		const onDropWindow = (event: DragEvent) => {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragDepthRef.current = 0;
			setIsDraggingFile(false);
		};

		window.addEventListener('dragenter', onDragEnter);
		window.addEventListener('dragover', onDragOver);
		window.addEventListener('dragleave', onDragLeave);
		window.addEventListener('drop', onDropWindow);

		return () => {
			window.removeEventListener('dragenter', onDragEnter);
			window.removeEventListener('dragover', onDragOver);
			window.removeEventListener('dragleave', onDragLeave);
			window.removeEventListener('drop', onDropWindow);
		};
	}, []);

	const compressAndUpload = useCallback(
		async (file: File) => {
			try {
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
				toast.success('Avatar actualizado correctamente');
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
			dragDepthRef.current = 0;
			setIsDraggingFile(false);

			const file = event.dataTransfer.files?.[0];
			if (file) {
				await compressAndUpload(file);
			}
		},
		[compressAndUpload],
	);

	return (
		<div ref={formRef} className='space-y-8'>
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				id='fileUpload'
				name='fileUpload'
				type='file'
				accept='image/*'
				onChange={handleFileUpload}
				className='sr-only'
			/>

			{/* Form Fields */}
			<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'>
				<div className='form-field'>
					<Label htmlFor='email'>Email</Label>
					<FieldWrap
						firstSuffix={
							<Icon icon='HeroEnvelope' className='mx-2 text-neutral-400' />
						}>
						<Input
							id='email'
							name='email'
							value={formik.values.email || ''}
							readOnly
							autoComplete='email'
							className='bg-neutral-50 dark:bg-neutral-800/50'
						/>
					</FieldWrap>
				</div>

				<div className='form-field'>
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

				<div className='form-field'>
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

				<div className='form-field'>
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

				<div className='form-field'>
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

				<div className='form-field'>
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

				<div className='form-field'>
					<Label htmlFor='phone_number'>Celular</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.phone_number}
						invalidFeedback={formik.errors.phone_number}>
						<FieldWrap
							firstSuffix={
								<Icon icon='HeroPhone' className='mx-2 text-neutral-400' />
							}>
							<Input
								id='phone_number'
								name='phone_number'
								value={formik.values.phone_number || ''}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
							/>
						</FieldWrap>
					</Validation>
				</div>

				<div className='form-field'>
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

				<div className='form-field sm:col-span-2'>
					<Label htmlFor='genero'>Género</Label>
					<div className='mt-2'>
						<RadioGroup isInline>
							{[
								{
									value: '0',
									label: 'No Especificado',
									icon: 'HeroQuestionMarkCircle',
								},
								{ value: '1', label: 'Masculino', icon: 'HeroUser' },
								{ value: '2', label: 'Femenino', icon: 'HeroUser' },
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

			{/* Drag Drop Overlay */}
			{isDraggingFile && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'
					onDragEnter={(event) => event.preventDefault()}
					onDragOver={(event) => {
						event.preventDefault();
						event.dataTransfer.dropEffect = 'copy';
					}}
					onDrop={handleDrop}>
					<div className='mx-4 max-w-md rounded-3xl border-2 border-dashed border-emerald-400 bg-white/95 p-8 text-center shadow-2xl dark:border-emerald-500 dark:bg-neutral-900/95'>
						<div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50'>
							<Icon
								icon='HeroArrowUpTray'
								className='h-8 w-8 text-emerald-600 dark:text-emerald-400'
							/>
						</div>
						<h3 className='mb-2 text-xl font-semibold text-neutral-900 dark:text-white'>
							Suelta tu imagen aquí
						</h3>
						<p className='text-sm text-neutral-500 dark:text-neutral-400'>
							La imagen será comprimida automáticamente a WebP y redimensionada a
							400px
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default EditProfileTab;
