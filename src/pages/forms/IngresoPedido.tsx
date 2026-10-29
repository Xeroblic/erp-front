import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';

interface PedidoFormData {
	nombreCliente: string;
	canalCompra: string;
	ordenCompra?: FileList | null;
	comprobantePago?: FileList | null;
}

const channels: TSelectOption[] = [
	{ value: 'WhatsApp', label: 'WhatsApp' },
	{ value: 'Correo', label: 'Correo Electrónico' },
	{ value: 'Presencial', label: 'Presencial' },
];

const schema = yup
	.object()
	.shape({
		nombreCliente: yup.string().required('El nombre del cliente es obligatorio'),
		canalCompra: yup.string().required('Debe seleccionar un canal de compra'),
		ordenCompra: yup.mixed<FileList>().nullable(),
		comprobantePago: yup.mixed<FileList>().nullable(),
	})
	.test(
		'at-least-one-file',
		'Debe adjuntar al menos una Orden de Compra o un Comprobante de Pago',
		function (value) {
			const hasOC = value.ordenCompra && value.ordenCompra.length > 0;
			const hasComprobante = value.comprobantePago && value.comprobantePago.length > 0;

			if (!hasOC && !hasComprobante) {
				return this.createError({
					path: 'comprobantePago',
					message: 'Debe adjuntar al menos una Orden de Compra o un Comprobante de Pago',
				});
			}

			return true;
		},
	);

export default function IngresoPedido() {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isValid, isDirty },
		reset,
	} = useForm<PedidoFormData>({
		resolver: yupResolver(schema as yup.ObjectSchema<PedidoFormData>),
		mode: 'onChange',
		defaultValues: {
			nombreCliente: '',
			canalCompra: '',
			ordenCompra: null,
			comprobantePago: null,
		},
	});

	const onSubmit = async (data: PedidoFormData) => {
		try {
			setIsSubmitting(true);

			// Aquí iría la lógica para enviar al backend usando FormData
			console.log('Datos del formulario listos para enviar:', data);

			// Simular envío
			await new Promise((resolve) => setTimeout(resolve, 1000));

			toast.success('Pedido ingresado con éxito');
			reset();
		} catch (error) {
			console.error('Error al enviar pedido:', error);
			toast.error('Ocurrió un error al ingresar el pedido');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<PageWrapper>
			<Container>
				<div className='mb-6 flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold text-zinc-900 dark:text-zinc-100'>
							Ingreso de Pedido
						</h1>
						<p className='mt-1 text-zinc-500'>
							Registra un nuevo pedido adjuntando su respectiva documentación.
						</p>
					</div>
				</div>

				<div className='max-w-3xl'>
					<Card>
						<CardHeader className='border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
									<Icon icon='HeroDocumentText' className='text-xl' />
								</div>
								<div>
									<h2 className='text-lg font-bold text-zinc-900 dark:text-zinc-100'>
										Datos del Pedido
									</h2>
								</div>
							</div>
						</CardHeader>
						<CardBody className='p-6'>
							<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
								{/* Fila 1: Cliente y Canal */}
								<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
									<div>
										<Label htmlFor='nombreCliente' className='required'>
											Nombre del Cliente
										</Label>
										<Input
											id='nombreCliente'
											{...register('nombreCliente')}
											placeholder='Ej. Juan Pérez o Empresa SpA'
											isValid={!errors.nombreCliente}
											invalidFeedback={errors.nombreCliente?.message}
											isTouched={isDirty}
										/>
										{errors.nombreCliente && (
											<p className='mt-1 text-xs text-red-500'>
												{errors.nombreCliente.message}
											</p>
										)}
									</div>

									<div>
										<Label htmlFor='canalCompra' className='required'>
											Canal de Compra
										</Label>
										<Controller
											name='canalCompra'
											control={control}
											render={({ field }) => (
												<SelectReact
													{...field}
													id='canalCompra'
													options={channels}
													value={
														channels.find(
															(c) => c.value === field.value,
														) || null
													}
													onChange={(selected) =>
														field.onChange(
															(selected as TSelectOption)?.value,
														)
													}
													placeholder='Selecciona un canal...'
													isValid={!errors.canalCompra}
													invalidFeedback={errors.canalCompra?.message}
													isTouched={isDirty}
												/>
											)}
										/>
										{errors.canalCompra && (
											<p className='mt-1 text-xs text-red-500'>
												{errors.canalCompra.message}
											</p>
										)}
									</div>
								</div>

								<div className='my-6 border-t border-zinc-200 dark:border-zinc-700'></div>

								{/* Fila 2: Archivos adjuntos */}
								<div className='space-y-4'>
									<div className='mb-4 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20'>
										<Icon
											icon='HeroInformationCircle'
											className='mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500'
										/>
										<p className='text-sm text-yellow-800 dark:text-yellow-200'>
											Es obligatorio adjuntar{' '}
											<strong>al menos un documento</strong> (Orden de Compra
											y/o Comprobante de Pago) para ingresar el pedido.
										</p>
									</div>

									<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
										<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
											<Label htmlFor='ordenCompra'>
												Orden de Compra (OC)
											</Label>
											<Input
												id='ordenCompra'
												type='file'
												{...register('ordenCompra')}
												accept='.pdf,.jpg,.jpeg,.png'
												className='mt-2'
											/>
											<p className='mt-2 text-xs text-zinc-500'>
												Formatos permitidos: PDF, JPG, PNG
											</p>
										</div>

										<div className='rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50'>
											<Label htmlFor='comprobantePago'>
												Comprobante de Pago
											</Label>
											<Input
												id='comprobantePago'
												type='file'
												{...register('comprobantePago')}
												accept='.pdf,.jpg,.jpeg,.png'
												className='mt-2'
											/>
											<p className='mt-2 text-xs text-zinc-500'>
												Formatos permitidos: PDF, JPG, PNG
											</p>
										</div>
									</div>

									{/* Mostrar error general de archivos si existe */}
									{errors.comprobantePago &&
										errors.comprobantePago.type === 'at-least-one-file' && (
											<p className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-500 dark:border-red-900/50 dark:bg-red-900/20'>
												<Icon
													icon='HeroExclamationTriangle'
													className='mr-2 inline-block h-4 w-4'
												/>
												{errors.comprobantePago.message}
											</p>
										)}
								</div>

								{/* Botones de acción */}
								<div className='mt-8 flex justify-end gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800'>
									<Button
										type='button'
										variant='outline'
										color='zinc'
										onClick={() => reset()}
										disabled={isSubmitting}>
										Limpiar Formulario
									</Button>

									<Button
										type='submit'
										color='blue'
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
			</Container>
		</PageWrapper>
	);
}
