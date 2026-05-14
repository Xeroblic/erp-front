import { useState } from 'react';
import { useFormik } from 'formik';
import classNames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import { useKeyPressEvent } from 'react-use';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import PageWrapper from '../components/layouts/PageWrapper/PageWrapper';
import Button from '../components/ui/Button';
import Input from '../components/form/Input';
import LogoTemplate from '../templates/layouts/Logo/Logo.template.tsx';
import FieldWrap from '../components/form/FieldWrap';
import Icon from '../components/icon/Icon';
import Validation from '../components/form/Validation';
import Card, { CardBody } from '../components/ui/Card';
import { useAppDispatch } from '@/store';
import { loginThunk } from '@/store/slices/auth/authSlice';
import Badge from '@/components/ui/Badge.tsx';
import useForceLightMode from '@/hooks/useForceLightMode.ts';

const LoginPage = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [passwordShowStatus, setPasswordShowStatus] = useState(false);
	const [isNavOpen, setIsNavOpen] = useState(false);

	useKeyPressEvent('Enter', () => {
		formik.handleSubmit();
	});

	const formik = useFormik({
		initialValues: { email: '', password: '' },
		validationSchema: Yup.object({
			email: Yup.string()
				.email('El correo electrónico no es válido')
				.required('El correo electrónico es obligatorio'),
			password: Yup.string()
				.min(8, 'La contraseña debe tener al menos 8 caracteres')
				.required('La contraseña es obligatoria'),
		}),
		onSubmit: async (values) => {
			try {
				await dispatch(loginThunk(values)).unwrap();
				navigate('/dashboard');
			} catch (e: any) {
				toast.error(e);
			}
		},
	});

	useForceLightMode();

	return (
		<PageWrapper isProtectedRoute={false} className='min-h-screen' name='Sign In'>
			<div className='fixed inset-0 -z-10'>
				<div className='absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500' />
				<div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] opacity-[0.06] mix-blend-overlay [background-size:18px_18px]' />
			</div>

			<div className='relative z-0 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10'>
				<Card className='w-full max-w-6xl overflow-hidden rounded-3xl border border-emerald-900/10 bg-white/75 shadow-2xl backdrop-blur-xl'>
					<div className='relative z-10 flex items-center justify-between border-b border-emerald-900/10 bg-white/70 px-4 py-3 sm:px-6'>
						<div className='flex items-center gap-2'>
							<LogoTemplate className='h-8 w-10' />
							<span className='text-lg font-extrabold tracking-wide text-emerald-900 sm:text-xl'>
								ZENTRIA
							</span>
						</div>

						<div className='hidden items-center gap-3 lg:flex'>
							<Link
								to='/landing'
								className='rounded-lg px-4 py-2 font-medium text-emerald-950/80 transition-colors hover:bg-emerald-50 hover:text-emerald-900'>
								INICIO
							</Link>
							<Link
								to='/recuperar-password'
								className='rounded-lg px-4 py-2 font-medium text-emerald-950/80 transition-colors hover:bg-emerald-50 hover:text-emerald-900'>
								RECUPERAR CONTRASEÑA
							</Link>
							<a
								href='https://ecoti.cl/support/help/3879743613'
								target='_blank'
								rel='noopener noreferrer'
								className='flex items-center rounded-lg px-4 py-2 font-medium text-emerald-950/80 transition-colors hover:bg-emerald-50 hover:text-emerald-900'>
								<Icon icon='HeroLifebuoy' className='mr-2 h-4 w-4' /> SOPORTE
							</a>
							<Button
								size='sm'
								className='border-emerald-500 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700'>
								TICKETS
							</Button>
						</div>

						<div className='lg:hidden'>
							<button
								aria-label='Abrir menú'
								onClick={() => setIsNavOpen(true)}
								className='inline-flex items-center justify-center rounded-md border border-emerald-900/15 bg-white/80 p-2 hover:bg-white'>
								<Icon icon='HeroBars3' className='h-6 w-6 text-emerald-900' />
							</button>
						</div>
					</div>

					<CardBody className='p-0'>
						<div className='grid grid-cols-1 lg:grid-cols-2'>
							<div className='flex items-center justify-center p-6 sm:p-8 lg:p-12'>
								<div className='w-full max-w-sm space-y-6'>
									<div className='flex justify-center'>
										<div className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50 shadow'>
											<Icon
												icon='HeroUser'
												className='h-6 w-6 text-emerald-600'
											/>
										</div>
									</div>

									<form
										onSubmit={formik.handleSubmit}
										className='space-y-5'
										noValidate>
										<Validation
											isValid={formik.isValid}
											isTouched={formik.touched.email}
											invalidFeedback={formik.errors.email}>
											<FieldWrap
												firstSuffix={
													<Icon
														icon='HeroEnvelope'
														className='mx-3 text-emerald-700/70'
													/>
												}>
												<Input
													dimension='lg'
													id='email'
													name='email'
													type='email'
													placeholder='Correo electrónico'
													aria-label='Correo electrónico'
													className='rounded-xl border-emerald-900/20 bg-white/80 text-emerald-950 placeholder:text-emerald-900/60 focus:border-emerald-500 focus:ring-emerald-500'
													value={formik.values.email}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
												/>
											</FieldWrap>
										</Validation>

										<Validation
											isValid={formik.isValid}
											isTouched={formik.touched.password}
											invalidFeedback={formik.errors.password}>
											<FieldWrap
												firstSuffix={
													<Icon
														icon='HeroLockClosed'
														className='mx-3 text-emerald-700/70'
													/>
												}
												lastSuffix={
													<button
														type='button'
														aria-label={
															passwordShowStatus
																? 'Ocultar contraseña'
																: 'Mostrar contraseña'
														}
														className='mx-2 rounded-md p-1.5 hover:bg-emerald-50'
														onClick={() =>
															setPasswordShowStatus(
																!passwordShowStatus,
															)
														}>
														<Icon
															icon={
																passwordShowStatus
																	? 'HeroEyeSlash'
																	: 'HeroEye'
															}
															className='h-5 w-5 text-emerald-700/80'
														/>
													</button>
												}>
												<Input
													dimension='lg'
													type={passwordShowStatus ? 'text' : 'password'}
													autoComplete='current-password'
													id='password'
													name='password'
													placeholder='Contraseña'
													aria-label='Contraseña'
													className='rounded-xl border-emerald-900/20 bg-white/80 text-emerald-950 placeholder:text-emerald-900/60 focus:border-emerald-500 focus:ring-emerald-500'
													value={formik.values.password}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
												/>
											</FieldWrap>
										</Validation>

										<div className='flex items-center justify-between text-sm'>
											<label className='flex select-none items-center gap-2'>
												<input
													type='checkbox'
													className='rounded border-emerald-900/25 text-emerald-600 focus:ring-emerald-600'
												/>
												<span className='text-emerald-900/80'>
													Recordar cuenta
												</span>
											</label>
											<Link
												to='/recuperar-password'
												className='font-medium text-emerald-700 hover:text-emerald-800'>
												¿Olvidaste tu contraseña?
											</Link>
										</div>

										<Button
											onClick={() => formik.handleSubmit()}
											size='lg'
											variant='solid'
											className='w-full font-semibold'>
											Iniciar sesión
										</Button>
									</form>

									<div className='space-y-2 text-center'>
										<div className='text-sm text-emerald-900/80'>
											¿Necesitas ayuda?
										</div>
										<a
											href='https://ecoti.cl/support/help/3879743613'
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex items-center text-sm font-medium text-emerald-700 hover:text-emerald-800'>
											<Icon icon='HeroLifebuoy' className='mr-1 h-4 w-4' />{' '}
											Contactar Soporte Técnico
										</a>
									</div>
								</div>
							</div>

							{/* Lado visual */}
							<div className='flex items-center justify-center bg-emerald-50/70 p-8 lg:p-12'>
								<div className='w-full max-w-md space-y-6 text-center'>
									<div className='flex justify-center'>
										<LogoTemplate className='h-28 w-36 drop-shadow-[0_6px_28px_rgba(16,185,129,0.25)] lg:h-36 lg:w-48' />
									</div>
									<div className='space-y-2'>
										<Badge className='text-4xl text-emerald-700 sm:text-5xl'>
											Bienvenido.
										</Badge>
										<p className='px-2 text-sm leading-relaxed text-emerald-900/90 sm:text-base lg:text-lg'>
											Sistema integral de gestión empresarial. Administra tu
											empresa de manera eficiente y moderna.
										</p>
									</div>
									<div className='flex items-center justify-center gap-8 pt-4'>
										<a
											href='https://ecoti.cl/'
											target='_blank'
											rel='noopener noreferrer'
											className='group flex h-28 w-28 items-center justify-center rounded-3xl border border-emerald-900/10 bg-emerald-100 p-5 shadow-xl transition-all hover:scale-105 hover:shadow-emerald-300/60 sm:h-32 sm:w-32'>
											<img
												src='/logo-ecotii.png'
												alt='EcoTi'
												className='h-16 w-16 object-contain drop-shadow-sm transition-transform group-hover:scale-110'
											/>
										</a>
										<a
											href='https://ecopc.cl/'
											target='_blank'
											rel='noopener noreferrer'
											className='group flex h-28 w-28 items-center justify-center rounded-3xl border border-emerald-900/10 bg-emerald-100 p-5 shadow-xl transition-all hover:scale-105 hover:shadow-emerald-300/60 sm:h-32 sm:w-32'>
											<img
												src='/logo-ecopc.png'
												alt='EcoPC'
												className='h-16 w-16 object-contain drop-shadow-sm transition-transform group-hover:scale-110'
											/>
										</a>
									</div>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</div>

			<div
				aria-hidden={!isNavOpen}
				onClick={() => setIsNavOpen(false)}
				className={classNames(
					'fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden',
					isNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
				)}
			/>
			<aside
				role='dialog'
				aria-label='Menú de navegación'
				className={classNames(
					'fixed right-0 top-0 z-[61] h-full w-[86%] max-w-xs border-l border-emerald-900/10 bg-white shadow-2xl transition-transform duration-300 lg:hidden',
					isNavOpen ? 'translate-x-0' : 'translate-x-full',
				)}>
				<div className='flex items-center justify-between border-b border-black/10 p-4'>
					<div className='flex items-center gap-2'>
						<LogoTemplate className='h-7 w-8' />
						<span className='font-bold text-emerald-900'>ZENTRIA</span>
					</div>
					<button
						aria-label='Cerrar menú'
						onClick={() => setIsNavOpen(false)}
						className='rounded-md p-2 hover:bg-emerald-50'>
						<Icon icon='HeroXMark' className='h-6 w-6 text-emerald-900' />
					</button>
				</div>
				<nav className='space-y-2 p-4'>
					<Link
						onClick={() => setIsNavOpen(false)}
						to='/landing'
						className='block rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-900 hover:bg-emerald-100'>
						Inicio
					</Link>
					<Link
						onClick={() => setIsNavOpen(false)}
						to='/recuperar-password'
						className='block rounded-xl px-4 py-3 font-medium text-emerald-900 hover:bg-emerald-50'>
						Recuperar contraseña
					</Link>
					<a
						onClick={() => setIsNavOpen(false)}
						href='https://ecoti.cl/support/help/3879743613'
						target='_blank'
						rel='noopener noreferrer'
						className='block rounded-xl px-4 py-3 font-medium text-emerald-900 hover:bg-emerald-50'>
						Soporte
					</a>
					<Button
						onClick={() => setIsNavOpen(false)}
						className='mt-2 w-full border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700'>
						Tickets
					</Button>
				</nav>
			</aside>
		</PageWrapper>
	);
};

export default LoginPage;
