import React from 'react';
import { FormikProps } from 'formik';
import { ICheckOutForm } from './types';
import { ICheckOutResponse } from '@/services/lockersPublicService';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import useForceLightMode from '@/hooks/useForceLightMode';
import FieldWrap from '@/components/form/FieldWrap';
import Label from '@/components/form/Label';
import Card, { CardBody } from '@/components/ui/Card';

interface PublicLockCareCheckoutViewProps {
	formik: FormikProps<ICheckOutForm>;
	isSubmittingCheckOut: boolean;
	checkoutResult: ICheckOutResponse | null;
	isBlocked: boolean;
}


export const PublicLockCareCheckoutView: React.FC<PublicLockCareCheckoutViewProps> = ({
	formik,
	isSubmittingCheckOut,
	checkoutResult,
	isBlocked,
}) => {
	useForceLightMode();

	return (
		<PageWrapper isProtectedRoute={false} name='Retiro de Equipo — Lock Care' title='Retiro de Equipo'>
			<main className='relative flex min-h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans'>
				{/* Fondo Decorativo */}
				<div className='absolute inset-0 z-0 pointer-events-none'>
					<div className='absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-400/10 blur-[120px]' />
					<div className='absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-emerald-400/10 blur-[120px]' />
				</div>

				{/* Header */}
				<header className='relative z-10 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80'>
					<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
						<div className='flex h-16 items-center justify-between'>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20'>
									<Icon icon='HeroCubeTransparent' className='h-6 w-6' color={'white'} />
								</div>
								<h1 className='text-xl font-bold tracking-tight text-zinc-900 dark:text-white'>
									Zentria <span className='font-light text-zinc-400 ml-1'>| Retiro</span>
								</h1>
							</div>
						</div>
					</div>
				</header>

				{/* Contenido Principal */}
				<div className='relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8'>
					<div className='w-full max-w-md animate-fade-in'>
						{!checkoutResult ? (
							<Card className='overflow-hidden border-zinc-200/60  shadow-2xl shadow-zinc-200/50 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90'>
								<div className='relative overflow-hidden bg-emerald-600 px-6 py-10 text-center text-white'>
									{/* Patrón de fondo sutil */}
									<div className='absolute inset-0 opacity-10' style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

									<div className='relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner'>
										<Icon icon='HeroKey' className='h-8 w-8 text-white' />
									</div>
									<h2 className='relative z-10 text-2xl font-bold text-white'>Retira tu Equipo</h2>
									<p className='relative z-10 mt-2 text-sm text-blue-100 font-medium'>
										Ingresa la palabra clave de tu correo
									</p>
								</div>

								<CardBody className='p-8 bg-zinc-300/50'>
									<form onSubmit={formik.handleSubmit} className='space-y-6'>
										<div className='space-y-2'>
											<Label htmlFor='withdrawal_keyword' className='text-zinc-700 font-semibold uppercase text-[10px] tracking-widest ml-1'>
												Palabra Clave
											</Label>
											<FieldWrap
												className='group transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl overflow-hidden'
												firstSuffix={<Icon className='mx-3 text-zinc-400 group-focus-within:text-blue-500 transition-colors' icon='HeroFingerPrint' />}
												lastSuffix={
													formik.touched.withdrawal_keyword && formik.errors.withdrawal_keyword ? (
														<Icon className='mx-3 text-red-500 animate-pulse' icon='HeroExclamationCircle' />
													) : undefined
												}>
												<Input
													id='withdrawal_keyword'
													name='withdrawal_keyword'
													placeholder='Palabra clave'

													autoComplete='off'
													className='uppercase tracking-[0.2em] text-center text-2xl font-bold py-4 border-none bg-zinc-50/50 focus:bg-white transition-all'
													onChange={(e) => {
														e.target.value = e.target.value.toUpperCase();
														formik.handleChange(e);
													}}
													onBlur={formik.handleBlur}
													value={formik.values.withdrawal_keyword}
												/>
											</FieldWrap>
											{formik.touched.withdrawal_keyword && formik.errors.withdrawal_keyword && (
												<p className='text-[11px] text-red-500 mt-2 text-center font-medium animate-slide-up'>{formik.errors.withdrawal_keyword}</p>
											)}
										</div>
											
										<Button
											type='submit'
											color='emerald'
											colorIntensity='500'
											variant='solid'
											className=' w-full py-4 text-lg font-bold shadow-xl 
													shadow-blue-500/20 active:scale-[0.98]
													 transition-transform rounded-xl'
											isDisable={isSubmittingCheckOut || !formik.values.withdrawal_keyword}
											icon={isSubmittingCheckOut ? 'HeroArrowPath' : 'HeroUnlock'}>
											{isBlocked ? 'Acceso Bloqueado' : isSubmittingCheckOut ? 'Validando...' : 'Verificar y Abrir'}
										</Button>

										{isBlocked && (
											<p className='text-center text-[11px] text-red-500 mt-4 font-bold animate-pulse'>
												Has excedido los intentos. Por seguridad, el sistema se ha bloqueado temporalmente.
											</p>
										)}

										<p className='text-center text-xs text-zinc-400 font-medium'>
											¿No tienes tu clave? Revisa tu bandeja de entrada o spam.
										</p>
									</form>
								</CardBody>
							</Card>
						) : (
							<div className='relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-2xl shadow-emerald-200/50 dark:border-emerald-900/20 dark:bg-zinc-900 animate-scale-in'>
								{/* Decoración de éxito */}
								<div className='absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 bg-emerald-500 rounded-b-full' />

								<div className='mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500 shadow-inner dark:bg-emerald-900/20 mb-8'>
									<Icon icon='HeroCheckCircle' className='h-12 w-12' />
								</div>

								<h2 className='text-3xl font-black text-zinc-900 dark:text-white tracking-tight'>¡Listo para Retiro!</h2>
								<p className='mt-2 text-zinc-500 font-medium'>Tu equipo te espera en el casillero.</p>

								<div className='mt-10 space-y-6'>
									{/* Intentar sacar el número del casiller de varias formas posibles */}
									{(checkoutResult.locker_number || (checkoutResult as any).locker?.number || (checkoutResult as any).number) && (
										<div className='relative group'>
											<div className='absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur group-hover:opacity-30 transition duration-1000'></div>
											<div className='relative flex flex-col items-center justify-center rounded-2xl bg-zinc-50 p-6 border border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700'>
												<span className='text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1'>Casillero</span>
												<p className='text-5xl font-black text-zinc-900 dark:text-white tracking-tighter'>
													{checkoutResult.locker_number ||
														(checkoutResult as any).locker?.number ||
														(checkoutResult as any).data?.locker?.number ||
														(checkoutResult as any).number ||
														(checkoutResult as any).casillero_numero ||
														'—'}
												</p>
											</div>
										</div>
									)}

									{/* Intentar sacar el PIN de varias formas posibles */}
									{(checkoutResult.current_pin || (checkoutResult as any).locker?.current_pin || (checkoutResult as any).pin) && (
										<div className='relative group'>
											<div className='absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur group-hover:opacity-30 transition duration-1000'></div>
											<div className='relative flex flex-col items-center justify-center rounded-2xl bg-blue-50 p-8 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20'>
												<span className='text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1'>PIN de Apertura</span>
												<p className='text-6xl font-mono font-black text-blue-600 tracking-[0.2em] ml-4 dark:text-blue-400'>
													{checkoutResult.current_pin ||
														(checkoutResult as any).locker?.current_pin ||
														(checkoutResult as any).locker_pin ||
														(checkoutResult as any).data?.locker_pin ||
														(checkoutResult as any).pin ||
														(checkoutResult as any).pin_apertura ||
														'—'}
												</p>
											</div>
										</div>
									)}
								</div>

								<div className='mt-10 rounded-2xl bg-zinc-900 p-5 text-white shadow-xl dark:bg-zinc-800'>
									<div className='flex items-start gap-3'>
										<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white'>
											<Icon icon='HeroInformationCircle' className='h-4 w-4' />
										</div>
										<p className='text-left text-xs leading-relaxed opacity-90 font-medium'>
											Ingresa el código <strong>{
												checkoutResult.current_pin ||
												(checkoutResult as any).locker?.current_pin ||
												(checkoutResult as any).locker_pin ||
												(checkoutResult as any).pin ||
												'—'
											}</strong> en el teclado del casillero <strong>{
												checkoutResult.locker_number ||
												(checkoutResult as any).locker?.number ||
												(checkoutResult as any).number ||
												'—'
											}</strong> para abrir la puerta.
										</p>
									</div>
								</div>

								<div className='mt-8 flex justify-center'>
									<Button
										variant='outline'
										color='zinc'
										className='text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-full opacity-50 hover:opacity-100 transition-opacity'
										onClick={() => window.location.href = '/'}>
										Finalizar
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<footer className='relative z-10 w-full py-6 px-4 text-center'>
					<p className='text-[10px] font-bold text-zinc-400 uppercase tracking-widest'>
						&copy; {new Date().getFullYear()} Zentria ERP • Soporte Técnico de Excelencia
					</p>
				</footer>
			</main>
		</PageWrapper>
	);
};
