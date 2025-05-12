import { useState } from 'react';
import { useFormik } from 'formik';
import classNames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layouts/PageWrapper/PageWrapper';
import Button from '../components/ui/Button';
import Input from '../components/form/Input';
import LogoTemplate from '../templates/layouts/Logo/Logo.template';
import FieldWrap from '../components/form/FieldWrap';
import Icon from '../components/icon/Icon';
import Validation from '../components/form/Validation';
import { useAppDispatch } from '@/store';
import { loginThunk } from '@/store/slices/auth/authSlice';
import { useKeyPressEvent } from 'react-use';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const LoginPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [passwordShowStatus, setPasswordShowStatus] = useState<boolean>(false);
    useKeyPressEvent('Enter', () => { formik.handleSubmit() });

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
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
                await dispatch(loginThunk({ ...values })).unwrap();
                navigate('/');
            } catch (e: any) {
                toast.error(e);
            }
        },
    });

    return (
        <PageWrapper isProtectedRoute={false} className='bg-white dark:bg-inherit' name='Sign In'>
            <div className='container mx-auto flex h-full items-center justify-center'>
                <div className='flex max-w-sm flex-col gap-8'>
                    <div>
                        <LogoTemplate className='h-12' />
                    </div>
                    <div>
                        <span className='text-4xl font-semibold'>Iniciar Sesión</span>
                    </div>
                    <div className='flex flex-col gap-4'>
                        <div className={classNames({ 'mb-2': !formik.isValid, })}>
                            <Validation
                                isValid={formik.isValid}
                                isTouched={formik.touched.email}
                                invalidFeedback={formik.errors.email}>
                                <FieldWrap
                                    firstSuffix={<Icon icon='HeroEnvelope' className='mx-2' />}>
                                    <Input
                                        dimension='lg'
                                        id='email'
                                        name='email'
                                        placeholder='Correo Electronico'
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FieldWrap>
                            </Validation>
                        </div>
                        <div className={classNames({ 'mb-2': !formik.isValid, })}>
                            <Validation
                                isValid={formik.isValid}
                                isTouched={formik.touched.password}
                                invalidFeedback={formik.errors.password}>
                                <FieldWrap
                                    firstSuffix={<Icon icon='HeroKey' className='mx-2' />}
                                    lastSuffix={
                                        <Icon
                                            className='mx-2 cursor-pointer'
                                            icon={passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'}
                                            onClick={() => {
                                                setPasswordShowStatus(!passwordShowStatus);
                                            }}
                                        />
                                    }>
                                    <Input
                                        dimension='lg'
                                        type={passwordShowStatus ? 'text' : 'password'}
                                        autoComplete='current-password'
                                        id='password'
                                        name='password'
                                        placeholder='Contraseña'
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                </FieldWrap>
                            </Validation>
                        </div>
                        <div>
                            <Button
                                size='lg'
                                variant='solid'
                                className='w-full font-semibold'
                                onClick={() => formik.handleSubmit()}>
                                Iniciar
                            </Button>
                        </div>
                    </div>
                    <div>
                        <span className='text-zinc-500'>
                            This site is protected by reCAPTCHA and the Google Privacy Policy.
                        </span>
                    </div>
                    <div>
                        <span className='flex gap-2 text-sm'>
                            <span className='text-zinc-400 dark:text-zinc-600'>
                                No tienes una cuenta
                            </span>
                            <Link to='/' className='hover:text-inherit'>
                                Registrate
                            </Link>
                        </span>
                        <span className='flex gap-2 text-sm'>
                            <span className='text-zinc-400 dark:text-zinc-600'>
                                Olvide mi
                            </span>
                            <Link to='/recuperar-password' className='hover:text-inherit'>
                                Contraseña
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default LoginPage;