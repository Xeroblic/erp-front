import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import { ProfileFormik } from '../types';

type Props = {
	formik: ProfileFormik;
	regionOptions: TSelectOption[];
	provinceOptions: TSelectOption[];
	comunaOptions: TSelectOption[];
};

const ContactTab = ({ formik, regionOptions, provinceOptions, comunaOptions }: Props) => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const fields = containerRef.current.querySelectorAll('.form-field');
		if (fields.length === 0) return;

		const ctx = gsap.context(() => {
			gsap.fromTo(
				fields,
				{ opacity: 0, y: 15 },
				{
					opacity: 1,
					y: 0,
					duration: 0.4,
					stagger: 0.08,
					ease: 'power2.out',
				},
			);
		}, containerRef);

		return () => ctx.revert();
	}, []);

	return (
		<div ref={containerRef} className='space-y-6'>
			<div className='form-field'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'>
						<Icon icon='HeroMapPin' className='h-5 w-5' />
					</div>
					<div>
						<h2 className='text-xl font-bold text-neutral-900 dark:text-white'>
							Información de Contacto
						</h2>
						<p className='text-sm text-neutral-500 dark:text-neutral-400'>
							Mantén tu dirección actualizada
						</p>
					</div>
				</div>
			</div>

			<div className='grid grid-cols-1 gap-x-6 gap-y-5'>
				<div className='form-field'>
					<Label htmlFor='direccion'>Dirección</Label>
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
							placeholder='Ej: Av. Principal 123, Oficina 4B'
						/>
					</Validation>
				</div>

				<div className='grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3'>
					<div className='form-field'>
						<Label htmlFor='region'>Región</Label>
						<Validation
							isValid={formik.isValid}
							isTouched={formik.touched.region}
							invalidFeedback={formik.errors.region}>
							<SelectReact
								id='region'
								name='region'
								isMulti={false}
								placeholder='Selecciona región'
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

					<div className='form-field'>
						<Label htmlFor='provincia'>Provincia</Label>
						<Validation
							isValid={formik.isValid}
							isTouched={formik.touched.provincia}
							invalidFeedback={formik.errors.provincia}>
							<SelectReact
								id='provincia'
								name='provincia'
								isMulti={false}
								placeholder='Selecciona provincia'
								options={provinceOptions}
								value={(() => {
									const v = formik.values.provincia;
									const found =
										provinceOptions.find((o) => o.value === v) || null;
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

					<div className='form-field'>
						<Label htmlFor='comuna'>Comuna</Label>
						<Validation
							isValid={formik.isValid}
							isTouched={formik.touched.comuna}
							invalidFeedback={formik.errors.comuna}>
							<SelectReact
								id='comuna'
								name='comuna'
								isMulti={false}
								placeholder='Selecciona comuna'
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
			</div>

			{/* Info Card */}
			<div className='form-field'>
				<div className='flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10'>
					<Icon
						icon='HeroInformationCircle'
						className='h-5 w-5 flex-shrink-0 text-blue-500'
					/>
					<p className='text-sm text-blue-700 dark:text-blue-300'>
						Tu información de ubicación nos ayuda a brindarte un mejor servicio y
						personalizar tu experiencia según tu zona geográfica.
					</p>
				</div>
			</div>
		</div>
	);
};

export default ContactTab;
