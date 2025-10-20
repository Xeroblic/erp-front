import FieldWrap from '@/components/form/FieldWrap';
import Input from '@/components/form/Input';
import Validation from '@/components/form/Validation';
import Icon from '@/components/icon/Icon';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Button from '@/components/ui/Button';
import ApiService from '@/services/ApiService';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import classNames from 'classnames';
import { useFormik } from 'formik';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

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
		<div className='container mx-auto flex h-full items-center justify-center px-4'>
			<div className='flex max-w-md flex-col items-center gap-6 text-center'>
				<LogoTemplate className='h-12' />
				<h2 className='text-2xl font-semibold text-white'>Invitacion no disponible</h2>
				<p className='text-sm text-zinc-400'>{message}</p>
				<Button
					size='lg'
					variant='solid'
					className='font-semibold'
					onClick={() => navigate('/login')}>
					Ir al inicio de sesion
				</Button>
			</div>
		</div>
	</PageWrapper>
);

function AceptarInvitacionEmpresa() {
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
				<div className='container mx-auto flex h-full items-center justify-center px-4'>
					<div className='flex max-w-md flex-col items-center gap-4 text-center'>
						<LogoTemplate className='h-12' />
						<Icon icon='DuoLoading' className='h-10 w-10 animate-spin text-white' />
						<p className='text-sm text-zinc-400'>Validando invitacion, por favor espera...</p>
					</div>
				</div>
			</PageWrapper>
		);
	}

	if (fetchError) {
		return renderInvalidState(navigate, fetchError, 'Invitacion no valida');
	}

	return (
		<PageWrapper isProtectedRoute={false} title='Aceptar invitacion a empresa'>
			<div className='container mx-auto flex h-full items-center justify-center px-4'>
				<div className='flex w-full max-w-sm flex-col gap-8'>
					<div className='flex justify-center'>
						<LogoTemplate className='h-12' />
					</div>
					<div className='text-center'>
						<span className='text-3xl font-semibold text-white'>Acepta la invitacion</span>
						<p className='mt-2 text-sm text-zinc-400'>
							Define una contrasena para activar tu cuenta y comenzar a usar el ERP.
						</p>
						{invitationInfo?.email ? (
							<p className='mt-3 text-xs text-zinc-500'>
								Invitacion enviada a{' '}
								<span className='font-semibold text-white'>{invitationInfo.email}</span>
							</p>
						) : null}
					</div>
					<form className='flex flex-col gap-4' onSubmit={formik.handleSubmit}>
						<div
							className={classNames({
								'mb-2': Boolean(formik.touched.password && formik.errors.password),
							})}>
							<Validation
								isValid={!formik.errors.password}
								isTouched={Boolean(formik.touched.password)}
								invalidFeedback={formik.errors.password}>
								<FieldWrap
									firstSuffix={<Icon icon='HeroKey' className='mx-2' />}
									lastSuffix={
										<Icon
											className='mx-2 cursor-pointer'
											icon={passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'}
											onClick={togglePasswordVisibility}
										/>
									}>
									<Input
										dimension='lg'
										type={passwordShowStatus ? 'text' : 'password'}
										id='password'
										name='password'
										placeholder='Contrasena'
										value={formik.values.password}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										autoComplete='new-password'
									/>
								</FieldWrap>
							</Validation>
						</div>
						<div
							className={classNames({
								'mb-2': Boolean(formik.touched.confirm_password && formik.errors.confirm_password),
							})}>
							<Validation
								isValid={!formik.errors.confirm_password}
								isTouched={Boolean(formik.touched.confirm_password)}
								invalidFeedback={formik.errors.confirm_password}>
								<FieldWrap
									firstSuffix={<Icon icon='HeroKey' className='mx-2' />}
									lastSuffix={
										<Icon
											className='mx-2 cursor-pointer'
											icon={passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'}
											onClick={togglePasswordVisibility}
										/>
									}>
									<Input
										dimension='lg'
										type={passwordShowStatus ? 'text' : 'password'}
										id='confirm_password'
										name='confirm_password'
										placeholder='Confirmar contrasena'
										value={formik.values.confirm_password}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										autoComplete='new-password'
									/>
								</FieldWrap>
							</Validation>
						</div>
						<div>
							<Button
								type='submit'
								size='lg'
								variant='solid'
								className='w-full font-semibold'
								disabled={formik.isSubmitting}>
								{formik.isSubmitting ? 'Activando...' : 'Activar cuenta'}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</PageWrapper>
	);
}

export default AceptarInvitacionEmpresa;
