import React, { useCallback, useMemo } from 'react';
import { FormikProps } from 'formik';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import Validation from '@/components/form/Validation';
import Icon from '@/components/icon/Icon';
import Checkbox from '@/components/form/Checkbox';
import { invoiceOptions, serviceTypeOptions } from './FormLockCare.data';
import { TicketFormValues } from './FormLockCare.types';
import FormLockCareServiceRepair from './FormLockCareServiceRepair';
import FormLockCareServiceUpgrade from './FormLockCareServiceUpgrade';

interface FormLockCareFormPanelProps {
	formik: FormikProps<TicketFormValues>;
	onOpenTerms: () => void;
}

const baseFieldClassName =
	'rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:!border-emerald-500';
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

const FormLockCareFormPanel: React.FC<FormLockCareFormPanelProps> = ({ formik, onOpenTerms }) => {
	const selectedInvoiceOption = useMemo(
		() =>
			invoiceOptions.find((option) => option.value === formik.values.requiresInvoice) ?? null,
		[formik.values.requiresInvoice],
	);

	const selectedServiceTypeOption = useMemo(
		() =>
			serviceTypeOptions.find((option) => option.value === formik.values.serviceType) ?? null,
		[formik.values.serviceType],
	);

	const showInvoiceFields = formik.values.requiresInvoice === 'si';

	const handleAttachmentChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFiles = event.currentTarget.files
				? Array.from(event.currentTarget.files)
				: [];

			if (selectedFiles.length === 0) {
				formik.setFieldValue('attachments', [], false);
				return;
			}

			if (selectedFiles.length > MAX_ATTACHMENTS) {
				toast.warning(`Solo puedes adjuntar hasta ${MAX_ATTACHMENTS} archivos.`);
			}

			const oversizedFiles: string[] = [];
			const filteredFiles = selectedFiles.slice(0, MAX_ATTACHMENTS).filter((file) => {
				if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
					oversizedFiles.push(file.name);
					return false;
				}
				return true;
			});

			if (oversizedFiles.length > 0) {
				toast.warning(
					`Se omitieron ${oversizedFiles.length} archivo(s) por superar ${MAX_ATTACHMENT_SIZE_MB}MB.`,
				);
			}

			formik.setFieldValue('attachments', filteredFiles, false);
		},
		[formik],
	);

	const handleRequiresInvoiceChange = useCallback(
		(option: unknown) => {
			const selected = option as TSelectOption | null;
			const value = selected?.value ?? '';
			formik.setFieldValue('requiresInvoice', value);
			if (value !== 'si') {
				formik.setFieldValue('invoiceRut', '');
				formik.setFieldValue('invoiceBusinessName', '');
				formik.setFieldValue('invoiceAddress', '');
			}
		},
		[formik],
	);

	const handleServiceTypeChange = useCallback(
		(option: unknown) => {
			const selected = option as TSelectOption | null;
			const value = selected?.value ?? '';
			formik.setFieldValue('serviceType', value);

			if (value === 'reparacion') {
				formik.setFieldValue('upgradeType', '');
				formik.setFieldValue('upgradeBrand', '');
				formik.setFieldValue('upgradeModel', '');
				formik.setFieldValue('upgradeSerialNumber', '');
			} else if (value === 'upgrade') {
				formik.setFieldValue('repairBrand', '');
				formik.setFieldValue('repairModel', '');
				formik.setFieldValue('repairSerialNumber', '');
				formik.setFieldValue('repairIncludesCharger', '');
			}
		},
		[formik],
	);

	const handleTermsAcceptedChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			formik.setFieldValue('termsAccepted', event.currentTarget.checked);
		},
		[formik],
	);

	const handleTermsAcceptedBlur = useCallback(() => {
		formik.setFieldTouched('termsAccepted', true, true);
	}, [formik]);

	return (
		<div className='self-start rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm sm:p-5'>
			<form
				onSubmit={formik.handleSubmit}
				noValidate
				className='grid grid-cols-1 gap-x-4 gap-y-2.5 md:grid-cols-2'>
				<div className='md:col-span-2'>
					<p className='text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700'>
						Contacto del cliente
					</p>
				</div>

				<div>
					<Label htmlFor='name'>Tu Nombre</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.name}
						invalidFeedback={formik.errors.name}>
						<Input
							id='name'
							name='name'
							placeholder='Tu Nombre'
							className={baseFieldClassName}
							value={formik.values.name}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>

				<div>
					<Label htmlFor='email'>Direccion de correo*</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.email}
						invalidFeedback={formik.errors.email}>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder='Direccion de correo*'
							className={baseFieldClassName}
							value={formik.values.email}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>

				<div>
					<Label htmlFor='phone'>Número de telefono</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.phone}
						invalidFeedback={formik.errors.phone}>
						<Input
							id='phone'
							name='phone'
							placeholder='Número de telefono'
							className={baseFieldClassName}
							value={formik.values.phone}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>

				<div>
					<Label htmlFor='requiresInvoice'>Factura*</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.requiresInvoice}
						invalidFeedback={formik.errors.requiresInvoice}>
						<SelectReact
							id='requiresInvoice'
							name='requiresInvoice'
							options={invoiceOptions}
							placeholder='Factura*'
							value={selectedInvoiceOption}
							onBlur={formik.handleBlur}
							onChange={handleRequiresInvoiceChange}
							className='rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800'
						/>
					</Validation>
				</div>

				{showInvoiceFields && (
					<>
						<div>
							<Label htmlFor='invoiceRut'>RUT de facturacion</Label>
							<Validation
								isValid={formik.isValid}
								isTouched={formik.touched.invoiceRut}
								invalidFeedback={formik.errors.invoiceRut}>
								<Input
									id='invoiceRut'
									name='invoiceRut'
									placeholder='Ej. 76.123.456-7'
									className={baseFieldClassName}
									value={formik.values.invoiceRut}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</Validation>
						</div>

						<div>
							<Label htmlFor='invoiceBusinessName'>Giro</Label>
							<Validation
								isValid={formik.isValid}
								isTouched={formik.touched.invoiceBusinessName}
								invalidFeedback={formik.errors.invoiceBusinessName}>
								<Input
									id='invoiceBusinessName'
									name='invoiceBusinessName'
									placeholder='Giro comercial'
									className={baseFieldClassName}
									value={formik.values.invoiceBusinessName}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</Validation>
						</div>

						<div className='md:col-span-2'>
							<Label htmlFor='invoiceAddress'>Direccion de facturacion</Label>
							<Validation
								isValid={formik.isValid}
								isTouched={formik.touched.invoiceAddress}
								invalidFeedback={formik.errors.invoiceAddress}>
								<Input
									id='invoiceAddress'
									name='invoiceAddress'
									placeholder='Direccion de facturacion'
									className={baseFieldClassName}
									value={formik.values.invoiceAddress}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
								/>
							</Validation>
						</div>
					</>
				)}

				<div className='mt-3 border-t border-zinc-200/80 pt-4 md:col-span-2'>
					<p className='text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700'>
						Datos del servicio
					</p>
				</div>

				<div className='md:col-span-2'>
					<Label htmlFor='serviceType'>Tipo de servicio*</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.serviceType}
						invalidFeedback={formik.errors.serviceType}>
						<SelectReact
							id='serviceType'
							name='serviceType'
							options={serviceTypeOptions}
							placeholder='Selecciona un tipo de servicio*'
							value={selectedServiceTypeOption}
							onBlur={formik.handleBlur}
							onChange={handleServiceTypeChange}
							className='rounded-xl border-zinc-300 bg-zinc-50 text-zinc-800'
						/>
					</Validation>
				</div>

				{formik.values.serviceType === 'reparacion' && (
					<FormLockCareServiceRepair formik={formik} />
				)}

				{formik.values.serviceType === 'upgrade' && (
					<FormLockCareServiceUpgrade formik={formik} />
				)}

				{/* <div className='mt-3 border-t border-zinc-200/80 pt-4 md:col-span-2'>
					<Label htmlFor='notes'>Notas adicionales</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.notes}
						invalidFeedback={formik.errors.notes}>
						<Textarea
							id='notes'
							name='notes'
							rows={2}
							placeholder='Notas adicionales'
							className={baseFieldClassName}
							value={formik.values.notes}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div> */}

				<div className='mt-3 border-t border-zinc-200/80 pt-4 md:col-span-2'>
					<p className='text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700'>
						Descripción y respaldo
					</p>
				</div>

				<div className='md:col-span-2'>
					<Label htmlFor='message'>Explicanos tu requerimiento*</Label>
					<Validation
						isValid={formik.isValid}
						isTouched={formik.touched.message}
						invalidFeedback={formik.errors.message}>
						<Textarea
							id='message'
							name='message'
							rows={3}
							placeholder='Mensaje*'
							className={baseFieldClassName}
							value={formik.values.message}
							onChange={formik.handleChange}
							onBlur={formik.handleBlur}
						/>
					</Validation>
				</div>

				<div className='md:col-span-2'>
					<Label htmlFor='attachments'>Adjuntos</Label>
					<label
						htmlFor='attachments'
						className='mt-1 flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 text-sm text-zinc-500 transition-colors hover:border-emerald-500 hover:text-emerald-700'>
						<span className='inline-flex items-center gap-2'>
							<Icon icon='HeroPaperClip' className='h-4 w-4' />
							Agregar adjuntos
						</span>
					</label>
					<Input
						id='attachments'
						name='attachments'
						type='file'
						multiple
						className='hidden'
						onChange={handleAttachmentChange}
					/>
					{formik.values.attachments.length > 0 && (
						<div className='mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700'>
							<Icon icon='HeroCheckCircle' className='h-4 w-4' />
							{formik.values.attachments.length} archivo(s) seleccionado(s)
						</div>
					)}
				</div>

				<div className='md:col-span-2'>
					<Checkbox
						id='terms'
						name='termsAccepted'
						isInline
						checked={formik.values.termsAccepted}
						onChange={handleTermsAcceptedChange}
						onBlur={handleTermsAcceptedBlur}
						className='py-0'
						label={
							<span className='inline-flex items-center gap-1 whitespace-nowrap text-sm'>
								Acepto los
								<Button
									type='button'
									variant='default'
									size='xs'
									className='!px-0 !py-0 font-medium text-emerald-600 hover:text-emerald-800'
									onClick={onOpenTerms}>
									Términos y Condiciones
								</Button>
							</span>
						}
					/>
					{formik.touched.termsAccepted && formik.errors.termsAccepted && (
						<p className='mt-1 text-sm text-red-600'>{formik.errors.termsAccepted}</p>
					)}
				</div>

				<div className='md:col-span-2'>
					<Button
						type='submit'
						variant='solid'
						color='emerald'
						isDisable={formik.isSubmitting || !formik.values.termsAccepted}
						isLoading={formik.isSubmitting}
						icon='HeroArrowRight'
						className='w-full justify-center rounded-xl py-3 font-semibold'>
						Enviar Ticket
					</Button>
				</div>
			</form>
		</div>
	);
};

export default React.memo(FormLockCareFormPanel);
