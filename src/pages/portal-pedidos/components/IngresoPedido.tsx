import React from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import useIngresoPedido from '../hooks/useIngresoPedido';
import { PEDIDO_CHANNELS } from '../types';

const IngresoPedido = () => {
	const {
		formik,
		fileInputRef,
		handleRutChange,
		handleNombreChange,
		handleCanalChange,
		handleCotizacionChange,
		handleLinkChange,
		handleReset,
	} = useIngresoPedido();

	const { values, errors, touched, isValid, isSubmitting, handleBlur, handleSubmit } = formik;

	return (
		<div className='w-full'>
			<Card className='w-full border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900'>
				<CardHeader className='border-b border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50'>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'>
							<Icon icon='HeroDocumentText' className='text-xl' />
						</div>
						<div>
							<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
								Ingreso de Nuevo Pedido
							</h2>
							<p className='text-sm text-zinc-500'>
								Completa los datos y adjunta los documentos requeridos.
							</p>
						</div>
					</div>
				</CardHeader>
				<CardBody className='p-6'>
					<form onSubmit={handleSubmit} className='space-y-6'>
						{/* Fila 1: RUT, Cliente y Canal */}
						<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
							<div>
								<Label htmlFor='rutCliente' className='required'>
									RUT del Cliente
								</Label>
								<Input
									id='rutCliente'
									name='rutCliente'
									placeholder='12345678-9'
									value={values.rutCliente}
									onChange={handleRutChange}
									onBlur={handleBlur}
									isValid={isValid}
									isTouched={touched.rutCliente}
									invalidFeedback={errors.rutCliente}
								/>
								{touched.rutCliente && errors.rutCliente && (
									<p className='mt-1 text-xs text-red-500'>{errors.rutCliente}</p>
								)}
							</div>

							<div>
								<Label htmlFor='nombreCliente' className='required'>
									Nombre del Cliente
								</Label>
								<Input
									id='nombreCliente'
									name='nombreCliente'
									placeholder='Ej. Juan Pérez o Empresa SpA'
									value={values.nombreCliente}
									onChange={handleNombreChange}
									onBlur={handleBlur}
									isValid={isValid}
									isTouched={touched.nombreCliente}
									invalidFeedback={errors.nombreCliente}
								/>
								{touched.nombreCliente && errors.nombreCliente && (
									<p className='mt-1 text-xs text-red-500'>
										{errors.nombreCliente}
									</p>
								)}
							</div>

							<div>
								<Label htmlFor='canalCompra' className='required'>
									Canal de Compra
								</Label>
								<SelectReact
									id='canalCompra'
									name='canalCompra'
									options={PEDIDO_CHANNELS}
									value={
										PEDIDO_CHANNELS.find(
											(c) => c.value === values.canalCompra,
										) ?? null
									}
									onChange={handleCanalChange}
									onBlur={handleBlur}
									placeholder='Selecciona un canal...'
									isValid={isValid}
									isTouched={touched.canalCompra}
									invalidFeedback={errors.canalCompra}
								/>
								{touched.canalCompra && errors.canalCompra && (
									<p className='mt-1 text-xs text-red-500'>
										{errors.canalCompra}
									</p>
								)}
							</div>
						</div>

						<div className='my-6 border-t border-zinc-200 dark:border-zinc-700' />

						{/* Fila 2: Archivos adjuntos y Link */}
						<div className='space-y-4'>
							<div className='mb-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20'>
								<Icon
									icon='HeroInformationCircle'
									className='mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500'
								/>
								<p className='text-sm text-yellow-800 dark:text-yellow-200'>
									Es obligatorio adjuntar <strong>al menos un documento</strong>{' '}
									(Cotización) o ingresar un <strong>Link asociado</strong> para
									ingresar el pedido.
								</p>
							</div>

							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
									<Label htmlFor='cotizacion'>
										Cotización (Opcional si hay Link)
									</Label>
									<Input
										ref={fileInputRef}
										id='cotizacion'
										name='cotizacion'
										type='file'
										accept='.pdf,.jpg,.jpeg,.png'
										className='mt-2'
										onChange={handleCotizacionChange}
									/>
									<p className='mt-2 text-xs text-zinc-500'>
										Formatos permitidos: PDF, JPG, PNG
									</p>
								</div>

								<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
									<Label htmlFor='link'>
										Link del Pedido / OC (Opcional si hay Cotización)
									</Label>
									<Input
										id='link'
										name='link'
										type='text'
										placeholder='https://...'
										className='mt-2'
										value={values.link}
										onChange={handleLinkChange}
										onBlur={handleBlur}
										isValid={isValid}
										isTouched={touched.link}
										invalidFeedback={errors.link}
									/>
									<p className='mt-2 text-xs text-zinc-500'>
										Pega el enlace al documento externo.
									</p>
								</div>
							</div>

							{/* El link sólo se valida con la regla «cotización o link» */}
							{touched.link && errors.link && (
								<p className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-500 dark:border-red-900/50 dark:bg-red-900/20'>
									<Icon
										icon='HeroExclamationTriangle'
										className='mr-2 inline-block h-4 w-4'
									/>
									{errors.link}
								</p>
							)}
						</div>

						{/* Botones de acción */}
						<div className='mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800'>
							<Button
								type='button'
								variant='outline'
								color='zinc'
								onClick={handleReset}
								disabled={isSubmitting}>
								Limpiar Formulario
							</Button>

							<Button
								type='submit'
								color='emerald'
								icon='HeroPaperAirplane'
								isDisable={!isValid || isSubmitting}
								isLoading={isSubmitting}>
								{isSubmitting ? 'Enviando...' : 'Ingresar Pedido'}
							</Button>
						</div>
					</form>
				</CardBody>
			</Card>
		</div>
	);
};

export default IngresoPedido;
