import React, { useRef, useState } from 'react';
import axios from 'axios';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import Button from '@/components/ui/Button';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Input from '@/components/form/Input';
import Card, { CardBody } from '@/components/ui/Card';
import { logout } from '@/store';
import useForceLightMode from '@/hooks/useForceLightMode';

const validationSchema = Yup.object().shape({
	new_password: Yup.string()
		.min(8, 'Mínimo 8 caracteres')
		.required('La nueva contraseña es obligatoria'),
	re_new_password: Yup.string()
		.oneOf([Yup.ref('new_password')], 'Las contraseñas no coinciden')
		.required('La confirmación de la contraseña es obligatoria'),
});

const ConfirmarNuevaPass = () => {
	// Obtener los parámetros de la URL antes de cualquier hook
	const params = new URLSearchParams(window.location.search);
	const token = params.get('token');
	const uid = params.get('uid');

	// Estado para mostrar mensaje de error si no hay token/uid
	const [invalidLink, setInvalidLink] = useState<boolean>(!token || !uid);

	const navigate = useNavigate();
	const newPasswordRef = useRef<HTMLInputElement>(null);
	const reNewPasswordRef = useRef<HTMLInputElement>(null);
	const [showNew, setShowNew] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	// Si los parámetros cambian dinámicamente (poco común), actualizar el estado
	// Esto asegura que el mensaje de error se muestre si la URL cambia después del primer render
	React.useEffect(() => {
		setInvalidLink(!token || !uid);
	}, [token, uid]);

	const formik = useFormik({
		initialValues: {
			new_password: '',
			re_new_password: '',
		},
		validationSchema,
		onSubmit: async (values) => {
			try {
				await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
					token,
					uid,
					password: values.new_password,
					password_confirmation: values.re_new_password,
				});

				toast.success('Contraseña restablecida con éxito.');
				logout();
				navigate('/login');
			} catch (error: any) {
				toast.error(
					error?.response?.data?.message || 'Error al restablecer la contraseña.',
				);
			}
		},
	});
	useForceLightMode();

	return invalidLink ? (
		<div className='flex min-h-screen items-center justify-center'>
			<p className='text-lg font-semibold text-red-600'>Enlace inválido o expirado.</p>
		</div>
	) : (
		<PageWrapper isProtectedRoute={false} className='min-h-screen' name='Confirmar Contraseña'>
			<div className='fixed inset-0 -z-10'>
				<div className='absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500' />
				<div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] opacity-[0.06]' />
			</div>

			<div className='relative flex min-h-screen items-center justify-center p-4'>
				<Card className='w-full max-w-3xl overflow-hidden rounded-3xl bg-white/75 shadow-2xl'>
					<div className='flex items-center justify-between border-b bg-white/70 px-4 py-3'>
						<div className='flex items-center gap-2'>
							<LogoTemplate className='h-8 w-10' />
							<span className='text-lg font-extrabold text-emerald-900'>ZENTRIA</span>
						</div>
					</div>

					<CardBody className='p-10'>
						<div className='mx-auto max-w-md'>
							<h1 className='mb-4 text-center text-3xl font-semibold text-emerald-800'>
								Nueva contraseña
							</h1>

							<form onSubmit={formik.handleSubmit} className='space-y-5' noValidate>
								<div>
									<div className='mb-2 flex items-center gap-2 font-medium text-emerald-900'>
										<Icon icon='HeroLockClosed' className='h-5 w-5' />
										Nueva contraseña
									</div>
									<div className='relative'>
										<Input
											ref={newPasswordRef}
											type={showNew ? 'text' : 'password'}
											name='new_password'
											placeholder='••••••••'
											value={formik.values.new_password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											className='w-full rounded-xl border-emerald-900/20'
										/>
										<button
											type='button'
											onClick={() => setShowNew(!showNew)}
											className='absolute inset-y-0 right-2 rounded-md p-1 hover:bg-emerald-50'>
											<Icon
												icon={showNew ? 'HeroEyeSlash' : 'HeroEye'}
												className='h-5 w-5 text-emerald-700'
											/>
										</button>
									</div>
									{formik.touched.new_password && formik.errors.new_password && (
										<div className='mt-1 text-sm text-red-600'>
											{formik.errors.new_password}
										</div>
									)}
								</div>

								<div>
									<div className='mb-2 flex items-center gap-2 font-medium text-emerald-900'>
										<Icon icon='HeroCheck' className='h-5 w-5' />
										Confirmar contraseña
									</div>
									<div className='relative'>
										<Input
											ref={reNewPasswordRef}
											type={showConfirm ? 'text' : 'password'}
											name='re_new_password'
											placeholder='••••••••'
											value={formik.values.re_new_password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											className='w-full rounded-xl border-emerald-900/20'
										/>
										<button
											type='button'
											onClick={() => setShowConfirm(!showConfirm)}
											className='absolute inset-y-0 right-2 rounded-md p-1 hover:bg-emerald-50'>
											<Icon
												icon={showConfirm ? 'HeroEyeSlash' : 'HeroEye'}
												className='h-5 w-5 text-emerald-700'
											/>
										</button>
									</div>
									{formik.touched.re_new_password &&
										formik.errors.re_new_password && (
											<div className='mt-1 text-sm text-red-600'>
												{formik.errors.re_new_password}
											</div>
										)}
								</div>

								<Button
									onClick={() => formik.handleSubmit()}
									className='w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700'>
									Guardar nueva contraseña
								</Button>

								<div className='text-center'>
									<Link
										to='/login'
										className='text-emerald-700 hover:text-emerald-800'>
										Volver a iniciar sesión
									</Link>
								</div>
							</form>
						</div>
					</CardBody>
				</Card>
			</div>
		</PageWrapper>
	);
};

export default ConfirmarNuevaPass;
