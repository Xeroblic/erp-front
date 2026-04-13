import classNames from 'classnames';
import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import FieldWrap from '@/components/form/FieldWrap';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ApiService from '@/services/ApiService';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import useForceLightMode from '@/hooks/useForceLightMode';

type InvitationPreview = {
	email?: string;
	first_name?: string;
	last_name?: string;
	role_name?: string;
	branch_id?: number;
};

const MIN_PASSWORD_LENGTH = 8;

const validationSchema = Yup.object().shape({
	password: Yup.string()
		.min(
			MIN_PASSWORD_LENGTH,
			`La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
		)
		.required('La contrasena es obligatoria'),
	confirm_password: Yup.string()
		.oneOf([Yup.ref('password')], 'Las contrasenas no coinciden')
		.required('Debes confirmar la contrasena'),
});

const resolveActivationError = (error: unknown): string => {
	if (!error || typeof error !== 'object') {
		return 'No se pudo activar la cuenta. Intentalo nuevamente.';
	}

	const apiError = error as {
		response?: {
			data?: {
				detail?: string;
				message?: string;
				errors?: Record<string, string[]>;
			};
		};
		message?: string;
	};

	const detail = apiError.response?.data?.detail ?? apiError.response?.data?.message;
	if (detail) return detail;

	const errors = apiError.response?.data?.errors;
	if (errors) {
		for (const key of Object.keys(errors)) {
			const messages = errors[key];
			if (Array.isArray(messages) && messages.length > 0) {
				return messages[0];
			}
		}
	}

	return apiError.message ?? 'No se pudo activar la cuenta. Intentalo nuevamente.';
};

const renderInvalidState = (
	navigate: ReturnType<typeof useNavigate>,
	message: string,
	title: string,
) => (
	<PageWrapper isProtectedRoute={false} title={title}>
		<div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-red-50 via-white to-orange-50'>
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute -left-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 blur-3xl' />
				<div className='absolute -right-40 top-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-orange-400/20 to-yellow-400/20 blur-3xl delay-700' />
			</div>

			<div className='relative flex min-h-screen items-center justify-center px-4'>
				<div className='w-full max-w-md text-center'>
					<div className='rounded-3xl bg-white/80 p-8 shadow-2xl ring-1 ring-gray-200/50 backdrop-blur-xl'>
						<div className='mb-6 flex justify-center'>
							<LogoTemplate className='h-16' />
						</div>
						<div className='mb-6 flex justify-center'>
							<div className='rounded-full bg-red-100 p-4'>
								<Icon icon='HeroXCircle' className='h-12 w-12 text-red-500' />
							</div>
						</div>
						<h2 className='mb-3 text-2xl font-bold text-gray-900'>{title}</h2>
						<p className='mb-6 text-gray-600'>{message}</p>
						<button
							onClick={() => navigate('/login')}
							className='group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl'>
							<span className='relative z-10 flex items-center justify-center gap-2'>
								<Icon icon='HeroArrowLeft' className='h-5 w-5' />
								Ir al inicio de sesión
							</span>
							<div className='absolute inset-0 -z-0 bg-gradient-to-r from-gray-700 to-gray-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
						</button>
					</div>
				</div>
			</div>
		</div>
	</PageWrapper>
);

const AceptarInvitacionEmpresa = () => {
	const { token } = useParams<{ token?: string }>();
	const navigate = useNavigate();
	const [passwordShowStatus, setPasswordShowStatus] = useState(false);
	const [invitationInfo, setInvitationInfo] = useState<InvitationPreview | null>(null);
	const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

	const isTokenMissing = useMemo(() => !token || token.trim().length === 0, [token]);

	useEffect(() => {
		if (isTokenMissing) {
			return;
		}

		let isMounted = true;

		const loadInvitation = async () => {
			setIsLoadingInvitation(true);
			setFetchError(null);

			try {
				const response = await ApiService.fetchData<InvitationPreview>({
					url: `/usuarios/activar/${token}`,
					method: 'get',
					headers: { Accept: 'application/json' },
				});

				if (isMounted) {
					setInvitationInfo(response.data ?? null);
				}
			} catch (error) {
				if (isMounted) {
					setFetchError(resolveActivationError(error));
				}
			} finally {
				if (isMounted) {
					setIsLoadingInvitation(false);
				}
			}
		};

		loadInvitation();

		return () => {
			isMounted = false;
		};
	}, [token, isTokenMissing]);

	const formik = useFormik({
		initialValues: {
			password: '',
			confirm_password: '',
		},
		validationSchema,
		onSubmit: async (values, { setSubmitting }) => {
			if (isTokenMissing) {
				toast.error('Enlace de activacion invalido o incompleto.');
				setSubmitting(false);
				return;
			}

			try {
				await ApiService.fetchData({
					url: '/usuarios/activar',
					method: 'post',
					headers: { 'Content-Type': 'application/json' },
					data: {
						token,
						password: values.password,
						password_confirmation: values.confirm_password,
					},
				});

				toast.success('Invitacion aceptada. Redirigiendote al inicio de sesion...', {
					autoClose: 1600,
				});

				setTimeout(() => {
					navigate('/login');
				}, 1600);
			} catch (error) {
				const message = resolveActivationError(error);
				toast.error(message, { autoClose: 2500 });
			} finally {
				setSubmitting(false);
			}
		},
	});

	const togglePasswordVisibility = () => {
		setPasswordShowStatus((prev) => !prev);
	};

	if (isTokenMissing) {
		return renderInvalidState(
			navigate,
			'Este enlace de activacion no es valido o ya fue utilizado.',
			'Invitacion no valida',
		);
	}

	if (isLoadingInvitation) {
		return (
			<PageWrapper isProtectedRoute={false} title='Validando invitacion'>
				<div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50'>
					<div className='absolute inset-0 overflow-hidden'>
						<div className='absolute -left-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl' />
						<div className='absolute -right-40 top-40 h-96 w-96 animate-pulse rounded-full bg-gradient-to-br from-indigo-400/20 to-pink-400/20 blur-3xl delay-700' />
					</div>{' '}
					<div className='relative flex min-h-screen items-center justify-center px-4'>
						<div className='w-full max-w-md text-center'>
							<div className='rounded-3xl bg-white/80 p-12 shadow-2xl ring-1 ring-gray-200/50 backdrop-blur-xl'>
								<div className='mb-6 flex justify-center'>
									<LogoTemplate className='h-16' />
								</div>
								<div className='mb-6 flex justify-center'>
									<Icon
										icon='DuoLoading'
										className='h-16 w-16 animate-spin text-blue-500'
									/>
								</div>
								<h3 className='mb-2 text-xl font-semibold text-gray-900'>
									Validando invitación
								</h3>
								<p className='text-gray-600'>Por favor espera un momento...</p>
							</div>
						</div>
					</div>
				</div>
			</PageWrapper>
		);
	}

	if (fetchError) {
		return renderInvalidState(navigate, fetchError, 'Invitacion no valida');
	}

	useForceLightMode();
	
	return (
		<PageWrapper isProtectedRoute={false} title='Aceptar invitacion a empresa'>
			<div className='relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50'>
				<div
					className='absolute inset-0 opacity-[0.03]'
					style={{
						backgroundImage:
							'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
						backgroundSize: '40px 40px',
					}}
				/>

				<div className='absolute inset-0 overflow-hidden'>
					<div className='absolute -left-20 top-0 h-96 w-96 rounded-full bg-blue-400/5 blur-3xl' />
					<div className='absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-400/5 blur-3xl' />
				</div>

				<div className='relative flex min-h-screen items-center justify-center px-4 py-12'>
					<div className='w-full max-w-[440px]'>
						<div className='rounded-2xl border border-gray-200 bg-white p-10 shadow-lg'>
							<div className='mb-10 flex flex-col items-center justify-center gap-1'>
								<LogoTemplate className='h-12' />
								<p className='text-xs tracking-wide text-gray-500'>Zentria ERP</p>
							</div>

							<div className='mb-2 text-center'>
								<Badge className='text-2xl font-bold text-gray-900'>
									Activa tu cuenta
								</Badge>
							</div>

							<p className='mb-8 text-center text-sm text-gray-600'>
								Configura tu contraseña para acceder al sistema ERP
							</p>

							{invitationInfo?.email && (
								<div className='mb-8 rounded-lg bg-gray-50 px-4 py-3.5 text-center'>
									<p className='text-xs font-medium uppercase tracking-wider text-gray-500'>
										Cuenta
									</p>
									<p className='mt-1.5 text-sm font-semibold text-gray-900'>
										{invitationInfo.email}
									</p>
								</div>
							)}

							<div className='mb-6 border-t border-gray-200' />

							<form className='space-y-5' onSubmit={formik.handleSubmit}>
								<div>
									<label
										htmlFor='password'
										className='mb-2.5 block text-sm font-medium text-gray-700'>
										Contraseña
									</label>
									<div className='relative'>
										<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
											<Icon
												icon='HeroKey'
												className='h-[18px] w-[18px] text-gray-400'
											/>
										</div>
										<input
											type={passwordShowStatus ? 'text' : 'password'}
											id='password'
											name='password'
											placeholder='Mínimo 8 caracteres'
											value={formik.values.password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											autoComplete='new-password'
											className='block w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
										/>
										<button
											type='button'
											onClick={togglePasswordVisibility}
											tabIndex={-1}
											className='absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600'>
											<Icon
												icon={
													passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'
												}
												className='h-[18px] w-[18px]'
											/>
										</button>
									</div>
									{formik.touched.password && formik.errors.password && (
										<p className='mt-2 text-xs text-red-600'>
											{formik.errors.password}
										</p>
									)}
								</div>

								<div>
									<label
										htmlFor='confirm_password'
										className='mb-2.5 block text-sm font-medium text-gray-700'>
										Confirmar contraseña
									</label>
									<div className='relative'>
										<div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5'>
											<Icon
												icon='HeroKey'
												className='h-[18px] w-[18px] text-gray-400'
											/>
										</div>
										<input
											type={passwordShowStatus ? 'text' : 'password'}
											id='confirm_password'
											name='confirm_password'
											placeholder='Repite la contraseña'
											value={formik.values.confirm_password}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											autoComplete='new-password'
											className='block w-full rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
										/>
										<button
											type='button'
											onClick={togglePasswordVisibility}
											tabIndex={-1}
											className='absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 transition-colors hover:text-gray-600'>
											<Icon
												icon={
													passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'
												}
												className='h-[18px] w-[18px]'
											/>
										</button>
									</div>
									{formik.touched.confirm_password &&
										formik.errors.confirm_password && (
											<p className='mt-2 text-xs text-red-600'>
												{formik.errors.confirm_password}
											</p>
										)}
								</div>

								<Button
									onClick={() => formik.handleSubmit()}
									variant='solid'
									color='blue'
									size='lg'
									icon={formik.isSubmitting ? 'DuoLoading' : 'HeroCheck'}
									isLoading={formik.isSubmitting}
									className='mt-7 w-full'>
									{formik.isSubmitting ? 'Activando cuenta...' : 'Activar cuenta'}
								</Button>
							</form>

							<div className='width mt-8 border-t border-gray-200 pt-6'>
								<p className='text-center text-xs leading-relaxed text-gray-500'>
									Al activar tu cuenta, aceptas los términos y condiciones del
									sistema ERP.
								</p>
							</div>
						</div>

						<div className='mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500'>
							<Icon icon='HeroLockClosed' className='h-3.5 w-3.5' />
							<span>Conexión segura y encriptada</span>
						</div>
					</div>
				</div>
			</div>

			<style>{`
				@keyframes fade-in {
					from {
						opacity: 0;
						transform: translateY(-10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-fade-in {
					animation: fade-in 0.6s ease-out;
				}
			`}</style>
		</PageWrapper>
	);
};

export default AceptarInvitacionEmpresa;
