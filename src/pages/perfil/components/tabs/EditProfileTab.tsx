import { useCallback, useEffect, useId, useRef, useState } from 'react';
import classNames from 'classnames';
import { toast } from 'react-toastify';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import DateInput from '@/components/form/DateInput';
import FieldWrap from '@/components/form/FieldWrap';
import Icon from '@/components/icon/Icon';
import Validation from '@/components/form/Validation';
import Radio, { RadioGroup } from '@/components/form/Radio';
import Avatar from '@/components/Avatar';
import Button from '@/components/ui/Button';
import { ImageZoom } from '@/components/ImageZoom';
import { ProfileFormik } from '../types';

type Props = {
	formik: ProfileFormik;
	onAvatarUpload: (file: File) => Promise<void> | void;
	avatarUrl?: string | null;
};

const EditProfileTab = ({ formik, onAvatarUpload, avatarUrl }: Props) => {
	const avatarName =
		[formik.values.first_name, formik.values.last_name].filter(Boolean).join(' ') || 'Usuario';

	const [isDraggingFile, setIsDraggingFile] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const dragDepthRef = useRef(0);
	const dropZoneGradientId = useId();

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
			dragDepthRef.current = 0;
			setIsDraggingFile(false);

			const file = event.dataTransfer.files?.[0];
			if (file) {
				await compressAndUpload(file);
			}
		},
		[compressAndUpload],
	);

	const dropZoneClassName = classNames(
		'group relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed px-10 py-12 text-center text-base transition-all',
		'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900',
		isDraggingFile
			? 'border-primary/80 bg-primary/5 text-primary dark:border-primary/60 dark:bg-primary/15 dark:text-white'
			: 'border-neutral-200 bg-white/95 text-neutral-600 hover:border-primary/60 hover:bg-primary/5 hover:text-primary dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-200',
	);

	const dropOverlayChecklist = [
		{ icon: 'HeroSparkles', text: 'Comprimimos y convertimos a WebP automáticamente.' },
		{ icon: 'HeroShieldCheck', text: 'Validamos el peso máximo de 2 MB antes de subir.' },
		{ icon: 'HeroCheckCircle', text: 'Ajustamos la imagen a 400 px para que luzca nítida.' },
	] as const;

	return (
		<div className='space-y-8'>
			<header className='space-y-1'>
				<p className='text-primary/70 text-sm font-semibold uppercase tracking-[0.2em]'>
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

			<section className='relative rounded-3xl border border-neutral-100/70 bg-white/95 p-6 shadow-lg shadow-neutral-900/5 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/80'>
				<input
					ref={fileInputRef}
					id='fileUpload'
					name='fileUpload'
					type='file'
					accept='image/*'
					onChange={handleFileUpload}
					className='sr-only'
				/>

				<div className='grid gap-8 lg:grid-cols-1'>
					<div className='mx-auto w-full max-w-2xl'>
						<div className='relative overflow-hidden rounded-[32px] border border-neutral-200/70 bg-gradient-to-br from-white via-white to-neutral-50 p-[1px] shadow-[0_25px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950'>
							<div className='relative rounded-[30px] bg-white/95 p-8 text-center dark:bg-neutral-950/85'>
								<div className='pointer-events-none absolute inset-0'>
									<div
										className='bg-primary/20 dark:bg-primary/40 absolute -right-14 top-0 h-40 w-40 rounded-full blur-3xl'
										aria-hidden
									/>
									<div
										className='absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-amber-200/60 blur-3xl dark:bg-amber-500/20'
										aria-hidden
									/>
								</div>
								<div className='relative flex flex-col items-center gap-6'>
									<div className='border-primary/20 bg-primary/10 text-primary/80 dark:border-primary/30 dark:bg-primary/20 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] dark:text-white/80'>
										<Icon icon='HeroSparkles' className='h-4 w-4' />
										Avatar
									</div>

									<div className='flex flex-col items-center gap-3'>
										<span className='text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500'>
											Vista previa
										</span>
										{avatarUrl ? (
											<ImageZoom
												imageUrl={avatarUrl}
												alt={`Avatar de ${avatarName}`}
												thumbnailUrl={avatarUrl}
												modalTitle='Vista previa del avatar'
												modalSubtitle='Haz clic o usa la rueda del ratón para hacer zoom'
												previewLabel='Ver ampliado'
												renderTrigger={(open) => (
													<button
														type='button'
														aria-label='Ver avatar ampliado'
														onClick={open}
														className='group relative inline-flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-neutral-100 shadow-[0_20px_45px_rgba(15,23,42,0.18)] ring-8 ring-white/80 transition hover:-translate-y-1 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-neutral-800'>
														<img
															src={avatarUrl}
															alt={avatarName}
															className='h-full w-full rounded-full object-cover'
														/>
														<span className='pointer-events-none absolute inset-0 rounded-full bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100' />
														<Icon
															icon='HeroMagnifyingGlassPlus'
															className='relative text-3xl text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100'
														/>
													</button>
												)}
											/>
										) : (
											<div className='relative inline-flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-neutral-100 shadow-[0_20px_45px_rgba(15,23,42,0.18)] ring-8 ring-white/80 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-neutral-800'>
												<Avatar
													src={undefined}
													name={avatarName}
													className='h-full w-full rounded-full border border-transparent object-cover'
												/>
											</div>
										)}
									</div>

									<div className='space-y-2'>
										<p className='text-2xl font-semibold text-neutral-900 dark:text-white'>
											{avatarName}
										</p>
										{/* <p className='text-sm text-neutral-500 dark:text-neutral-300'>
											Mantén una foto luminosa y centrada; ayuda al resto del
											equipo a reconocerte fácilmente en toda la plataforma.
										</p> */}
									</div>

									<div className='flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-neutral-400 dark:text-neutral-400'>
										<span className='flex items-center gap-2'>
											<Icon
												icon='HeroPhoto'
												className='text-primary/60 h-4 w-4'
											/>
											JPG, PNG o WebP
										</span>
										<span className='flex items-center gap-2'>
											<Icon
												icon='HeroArrowUpTray'
												className='h-4 w-4 text-amber-500'
											/>
											≤ 2&nbsp;MB
										</span>
										<span className='flex items-center gap-2'>
											<Icon
												icon='HeroSparkles'
												className='h-4 w-4 text-emerald-500'
											/>
											400&nbsp;px recomendado
										</span>
									</div>

									<Button
										variant='outline'
										size='lg'
										icon='HeroCamera'
										onClick={openFilePicker}
										className='border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 dark:border-primary/30 dark:bg-primary/20 w-full max-w-xs justify-center rounded-full border text-sm font-semibold transition dark:text-white'>
										Click para cambiar avatar o arrastra una imagen
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{isDraggingFile && (
					<div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-6'>
						<div className='pointer-events-auto relative w-full max-w-2xl space-y-4'>
							<div className='absolute inset-0 rounded-2xl bg-white/40 backdrop-blur-[2px] dark:bg-black/40' />

							<div className='relative rounded-2xl  border-2 border-dashed border-emerald-600 bg-emerald-300/30 p-5 shadow-lg '>
								<p className='text-sm text-neutral-600 dark:text-neutral-300'>
									Arrastra una imagen o selecciona un archivo desde tu computador.
									El sistema la comprimirá, convertirá a WebP y ajustará su tamaño
									para que luzca impecable en toda la plataforma.
								</p>

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
									onDragEnter={(event) => event.preventDefault()}
									onDragOver={(event) => {
										event.preventDefault();
										event.dataTransfer.dropEffect = 'copy';
									}}
									onDrop={handleDrop}
									className={dropZoneClassName}>
									<Icon
										icon='HeroArrowUpTray'
										className='mb-3 h-10 w-10 text-current'
									/>
									<span className='text-sm font-semibold'>
										Suelta tu imagen aquí
									</span>
									<span className='text-xs text-neutral-500 dark:text-neutral-400'>
										o haz clic para explorar tus archivos
									</span>
									<div className='mt-4 space-y-1 text-xs text-neutral-400 dark:text-neutral-500'>
										<p>Formatos sugeridos: JPG, PNG, WEBP.</p>
										<p>Peso máximo permitido: 2&nbsp;MB.</p>
									</div>
								</div>

							</div>
						</div>
					</div>
				)}
			</section>

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
