import axios from 'axios';
import { useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import Button from '@/components/ui/Button';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Input from '@/components/form/Input';
import { logout } from '@/store';

const validationSchema = Yup.object().shape({
	email: Yup.string()
		.email('Correo electrónico no válido')
		.required('Correo electrónico es requerido'),
});

const RecuperarPassword = () => {
	const emailRef = useRef<HTMLInputElement>(null);
	const [isFormSubmitted, setIsFormSubmitted] = useState(false);
	const [isNavOpen, setIsNavOpen] = useState(false);
	const navigate = useNavigate();

	const formik = useFormik({
		initialValues: { email: '' },
		validationSchema,
		onSubmit: async (values) => {
			try {
				await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
					email: values.email,
				});
				logout();
				toast.success('Enlace de restablecimiento de contraseña enviado a tu correo.');
				setIsFormSubmitted(true);
			} catch (error) {
				toast.error('Error al enviar el enlace de restablecimiento de contraseña.');
			}
		},
	});

	return (
		<PageWrapper isProtectedRoute={false} className='min-h-screen' name='Recuperar Contraseña'>
			{/* Fondo clarito en verdes */}
			<div className='fixed inset-0 -z-10'>
				<div className='absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500' />
				<div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] opacity-[0.06] mix-blend-overlay [background-size:18px_18px]' />
			</div>

			<div className='relative z-0 flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10'>
				<Card className='w-full max-w-3xl overflow-hidden rounded-3xl border border-emerald-900/10 bg-white/75 shadow-2xl backdrop-blur-xl'>
					{/* Header dentro de la card (mismo estilo que login) */}
					<div className='flex items-center justify-between border-b border-emerald-900/10 bg-white/70 px-4 py-3 sm:px-6'>
						<div className='flex items-center gap-2'>
							<LogoTemplate className='h-8 w-10' />
							<span className='text-lg font-extrabold tracking-wide text-emerald-900 sm:text-xl'>
								ZENTRIA
							</span>
						</div>
						<div className='hidden items-center gap-3 sm:flex'>
							<Link
								to='/login'
								className='rounded-lg px-3 py-2 font-medium text-emerald-950/80 transition-colors hover:bg-emerald-50 hover:text-emerald-900'>
								Volver a iniciar sesión
							</Link>
						</div>
						{/* botón mobile opcional */}
						<div className='sm:hidden'>
							<button
								aria-label='Abrir menú'
								onClick={() => setIsNavOpen(true)}
								className='inline-flex items-center justify-center rounded-md border border-emerald-900/15 bg-white/80 p-2 hover:bg-white'>
								<Icon icon='HeroBars3' className='h-6 w-6 text-emerald-900' />
							</button>
						</div>
					</div>

					<CardBody className='p-0'>
						{/* Contenido principal */}
						<div className='p-6 sm:p-8 lg:p-10'>
							{!isFormSubmitted ? (
								<div className='mx-auto max-w-md'>
									<div className='mb-6 space-y-2 text-center'>
										<h1 className='text-3xl font-semibold text-emerald-800 sm:text-4xl'>
											Recuperar contraseña
										</h1>
										<p className='text-emerald-900/80'>
											Ingresa tu correo y te enviaremos un enlace para
											restablecer tu contraseña.
										</p>
									</div>

									<form
										onSubmit={formik.handleSubmit}
										className='space-y-5'
										noValidate>
										<div>
											<div className='mb-2 flex items-center gap-2 font-medium text-emerald-900/90'>
												<Icon icon='HeroEnvelope' className='h-5 w-5' />
												Correo electrónico
											</div>
											<Input
												ref={emailRef}
												type='email'
												name='email'
												placeholder='tu@correo.com'
												value={formik.values.email}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
												className={classNames(
													'w-full rounded-xl border-emerald-900/20 bg-white/80 text-emerald-950 placeholder:text-emerald-900/60 focus:border-emerald-500 focus:ring-emerald-500',
												)}
											/>
											{formik.errors.email && formik.touched.email && (
												<div className='mt-2 text-sm text-red-600'>
													{formik.errors.email}
												</div>
											)}
										</div>

										<Button
											onClick={() => formik.handleSubmit()}
											className='w-full transform rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl'>
											Enviar enlace de restablecimiento
										</Button>

										<div className='text-center'>
											<Link
												to='/login'
												className='font-medium text-emerald-700 hover:text-emerald-800'>
												Volver a iniciar sesión
											</Link>
										</div>
									</form>
								</div>
							) : (
								// Estado de éxito (misma estética)
								<div className='mx-auto max-w-md space-y-6 text-center'>
									<div className='flex justify-center'>
										<div className='flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-50 shadow'>
											<Icon
												icon='HeroCheckCircle'
												className='h-8 w-8 text-emerald-600'
											/>
										</div>
									</div>
									<h2 className='text-3xl font-semibold text-emerald-800 sm:text-4xl'>
										Correo enviado
									</h2>
									<p className='text-emerald-900/85'>
										Revisa tu bandeja de entrada y sigue el enlace para
										restablecer tu contraseña. Si no lo ves, mira en “Spam” o
										“Promociones”.
									</p>
									<div className='grid gap-3 sm:grid-cols-2'>
										<Button
											onClick={() => navigate('/login')}
											className='w-full rounded-xl border-emerald-500 bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700'>
											Ir al login
										</Button>
										<Button
											variant='outline'
											onClick={() => setIsFormSubmitted(false)}
											className='w-full rounded-xl border-emerald-600 py-3 text-emerald-700 hover:bg-emerald-50'>
											Enviar a otro correo
										</Button>
									</div>
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			</div>

			{/* Drawer mobile simple (por consistencia con login) */}
			<div
				aria-hidden={!isNavOpen}
				onClick={() => setIsNavOpen(false)}
				className={classNames(
					'fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity sm:hidden',
					isNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
				)}
			/>
			<aside
				role='dialog'
				aria-label='Menú de navegación'
				className={classNames(
					'fixed right-0 top-0 z-[61] h-full w-[86%] max-w-xs border-l border-emerald-900/10 bg-white shadow-2xl transition-transform duration-300 sm:hidden',
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
						to='/login'
						className='block rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-900 hover:bg-emerald-100'>
						Volver al login
					</Link>
					<a
						onClick={() => setIsNavOpen(false)}
						href='https://ecoti.cl/support/help/3879743613'
						target='_blank'
						rel='noopener noreferrer'
						className='block rounded-xl px-4 py-3 font-medium text-emerald-900 hover:bg-emerald-50'>
						Soporte
					</a>
				</nav>
			</aside>
		</PageWrapper>
	);
};

export default RecuperarPassword;
