import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormikProps } from 'formik';
import { ISubempresaFormValues, ISubempresaCommercialView } from '@/interface/empresas.interface';

const ComercialParts = ({
	isEditing,
	formik,
	commercialView,
	allowedPaymentOptions,
}: {
	isEditing: boolean;
	formik: FormikProps<ISubempresaFormValues>;
	commercialView: ISubempresaCommercialView;
	allowedPaymentOptions: TSelectOption[];
}) => {
	return (
		<div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
			<Card className='lg:col-span-1'>
				<CardHeader>
					<CardTitle>Datos Comerciales</CardTitle>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label className='text-lg font-semibold' htmlFor='documentsEmail'>
								Email documentos
							</Label>
							{isEditing ? (
								<Input
									id='documentsEmail'
									name='documentsEmail'
									type='email'
									placeholder='documentos@acme.cl'
									value={formik.values.documentsEmail}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{commercialView.documentsEmail || 'Sin email'}
								</div>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='salesEmail'>
								Email ventas
							</Label>
							{isEditing ? (
								<Input
									id='salesEmail'
									name='salesEmail'
									type='email'
									placeholder='ventas@acme.cl'
									value={formik.values.salesEmail}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{commercialView.salesEmail || 'Sin email'}
								</div>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label className='text-lg font-semibold' htmlFor='deliveryTerm'>
								Término de entrega
							</Label>
							{isEditing ? (
								<Input
									id='deliveryTerm'
									name='deliveryTerm'
									placeholder='Entrega en 5 días hábiles'
									value={formik.values.deliveryTerm}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{commercialView.deliveryTerm || 'Sin información'}
								</div>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='giro'>
								Giro
							</Label>
							{isEditing ? (
								<Input
									id='giro'
									name='giro'
									placeholder='Servicios tecnológicos'
									value={formik.values.giro}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{commercialView.giro || 'Sin giro'}
								</div>
							)}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<div>
							<Label className='text-lg font-semibold' htmlFor='quoteValidityText'>
								Texto validez cotización
							</Label>
							{isEditing ? (
								<Input
									id='quoteValidityText'
									name='quoteValidityText'
									placeholder='Oferta válida salvo cambios de proveedor'
									value={formik.values.quoteValidityText}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{commercialView.quoteValidityText || 'Sin texto definido'}
								</div>
							)}
						</div>
						<div>
							<Label className='text-lg font-semibold' htmlFor='quoteValidityDays'>
								Días de validez
							</Label>
							{isEditing ? (
								<Input
									id='quoteValidityDays'
									name='quoteValidityDays'
									type='number'
									placeholder='7'
									value={formik.values.quoteValidityDays ?? ''}
									onChange={formik.handleChange}
									onBlur={formik.handleBlur}
									disabled={formik.isSubmitting}
								/>
							) : (
								<div className='text-sm text-zinc-700'>
									{commercialView.quoteValidityDays ?? 'No definido'}
								</div>
							)}
						</div>
					</div>

					<div>
						<Label className='text-lg font-semibold' htmlFor='commercialTerms'>
							Términos comerciales
						</Label>
						{isEditing ? (
							<Input
								id='commercialTerms'
								name='commercialTerms'
								placeholder='Condiciones Comerciales Generales...'
								value={formik.values.commercialTerms}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
						) : (
							<div className='text-sm text-zinc-700'>
								{commercialView.commercialTerms || 'Sin términos'}
							</div>
						)}
					</div>

					<div>
						<Label className='text-lg font-semibold' htmlFor='bankDetails'>
							Datos bancarios
						</Label>
						{isEditing ? (
							<Input
								id='bankDetails'
								name='bankDetails'
								placeholder='Banco Estado, CTA 1234567...'
								value={formik.values.bankDetails}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
							/>
						) : (
							<div className='text-sm text-zinc-700'>
								{commercialView.bankDetails || 'Sin datos bancarios'}
							</div>
						)}
					</div>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Métodos de pago</CardTitle>
				</CardHeader>
				<CardBody className='space-y-4'>
					<div>
						<Label className='text-lg font-semibold' htmlFor='allowedPaymentMethods'>
							Métodos permitidos
						</Label>
						{isEditing ? (
							<SelectReact
								isMulti
								name='allowedPaymentMethods'
								placeholder='Seleccione métodos'
								value={allowedPaymentOptions.filter((opt) =>
									(formik.values.allowedPaymentMethods || []).includes(opt.value),
								)}
								onChange={(opts) =>
									formik.setFieldValue(
										'allowedPaymentMethods',
										(opts as TSelectOption[] | null)?.map((o) => o.value) || [],
									)
								}
								options={allowedPaymentOptions}
								isDisabled={formik.isSubmitting}
							/>
						) : (
							<div className='flex flex-wrap gap-2'>
								{(commercialView.allowedPaymentMethods || []).length ? (
									(commercialView.allowedPaymentMethods as string[]).map((m) => (
										<Badge
											key={m}
											variant='outline'
											className='bg-zinc-50 px-2'>
											{m}
										</Badge>
									))
								) : (
									<span className='text-sm text-zinc-500'>
										Sin métodos configurados
									</span>
								)}
							</div>
						)}
					</div>
					<div>
						<Label className='text-lg font-semibold' htmlFor='defaultPaymentMethod'>
							Método por defecto
						</Label>
						{isEditing ? (
							<SelectReact
								name='defaultPaymentMethod'
								placeholder='Seleccione método por defecto'
								value={
									allowedPaymentOptions.find(
										(o) => o.value === formik.values.defaultPaymentMethod,
									) || null
								}
								onChange={(opt) =>
									formik.setFieldValue(
										'defaultPaymentMethod',
										(opt as TSelectOption | null)?.value || '',
									)
								}
								options={allowedPaymentOptions.filter((opt) =>
									(formik.values.allowedPaymentMethods || []).includes(opt.value),
								)}
								isDisabled={formik.isSubmitting}
							/>
						) : (
							<div className='text-sm text-zinc-700'>
								{commercialView.defaultPaymentMethod || 'Sin método por defecto'}
							</div>
						)}
						{formik.touched.defaultPaymentMethod &&
							formik.errors.defaultPaymentMethod && (
								<p className='mt-1 text-sm text-red-600'>
									{formik.errors.defaultPaymentMethod as string}
								</p>
							)}
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default ComercialParts;
