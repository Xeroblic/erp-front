import { useState } from 'react';
import { useFormik } from 'formik';
import classNames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
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
import { useKeyPressEvent } from 'react-use';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Badge from '@/components/ui/Badge.tsx';

const LoginPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [passwordShowStatus, setPasswordShowStatus] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false); // drawer mobile

    useKeyPressEvent('Enter', () => { formik.handleSubmit(); });

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema: Yup.object({
            email: Yup.string().email('El correo electrónico no es válido').required('El correo electrónico es obligatorio'),
            password: Yup.string().min(8, 'La contraseña debe tener al menos 8 caracteres').required('La contraseña es obligatoria'),
        }),
        onSubmit: async (values) => {
            try { await dispatch(loginThunk(values)).unwrap(); navigate('/dashboard'); }
            catch (e: any) { toast.error(e); }
        },
    });

    return (
        <PageWrapper isProtectedRoute={false} className='min-h-screen' name='Sign In'>
            {/* BG clarito */}
            <div className='fixed inset-0 -z-10'>
                <div className='absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500' />
                <div className='absolute inset-0 opacity-[0.06] mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] [background-size:18px_18px]' />
            </div>

            <div className='relative z-0 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10'>
                {/* CARD CONTENEDORA (nav + contenido adentro en desktop) */}
                <Card className='w-full max-w-6xl bg-white/75 backdrop-blur-xl border border-emerald-900/10 rounded-3xl shadow-2xl overflow-hidden'>
                    {/* HEADER DENTRO DE LA CARD */}
                    <div className='relative z-10 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/70 border-b border-emerald-900/10'>
                        <div className='flex items-center gap-2'>
                            <LogoTemplate className='h-8 w-10' />
                            <span className='text-emerald-900 font-extrabold text-lg sm:text-xl tracking-wide'>ZENTRIA</span>
                        </div>

                        {/* desktop menu (aparece dentro de la card) */}
                        <div className='hidden lg:flex items-center gap-3'>
                            <Link to='/landing' className='px-4 py-2 text-emerald-950/80 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg font-medium transition-colors'>INICIO</Link>
                            <Link to='/recuperar-password' className='px-4 py-2 text-emerald-950/80 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg font-medium transition-colors'>RECUPERAR CONTRASEÑA</Link>
                            <a href='https://ecoti.cl/support/help/3879743613' target='_blank' rel='noopener noreferrer' className='px-4 py-2 text-emerald-950/80 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg font-medium transition-colors flex items-center'>
                                <Icon icon='HeroLifebuoy' className='mr-2 w-4 h-4' /> SOPORTE
                            </a>
                            <Button size='sm' className='font-semibold px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'>TICKETS</Button>
                        </div>

                        {/* mobile hamburger (abre drawer FULL, por encima de todo) */}
                        <div className='lg:hidden'>
                            <button
                                aria-label='Abrir menú'
                                onClick={() => setIsNavOpen(true)}
                                className='inline-flex items-center justify-center rounded-md border border-emerald-900/15 bg-white/80 hover:bg-white p-2'>
                                <Icon icon='HeroBars3' className='w-6 h-6 text-emerald-900' />
                            </button>
                        </div>
                    </div>

                    {/* CONTENIDO */}
                    <CardBody className='p-0'>
                        <div className='grid grid-cols-1 lg:grid-cols-2'>
                            {/* Lado form */}
                            <div className='flex items-center justify-center p-6 sm:p-8 lg:p-12'>
                                <div className='w-full max-w-sm space-y-6'>
                                    <div className='flex justify-center'>
                                        <div className='w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-400 bg-emerald-50 shadow'>
                                            <Icon icon='HeroUser' className='w-6 h-6 text-emerald-600' />
                                        </div>
                                    </div>

                                    <form onSubmit={formik.handleSubmit} className='space-y-5' noValidate>
                                        <Validation isValid={formik.isValid} isTouched={formik.touched.email} invalidFeedback={formik.errors.email}>
                                            <FieldWrap firstSuffix={<Icon icon='HeroEnvelope' className='mx-3 text-emerald-700/70' />}>
                                                <Input
                                                    dimension='lg'
                                                    id='email'
                                                    name='email'
                                                    type='email'
                                                    placeholder='Correo electrónico'
                                                    aria-label='Correo electrónico'
                                                    className='bg-white/80 border-emerald-900/20 text-emerald-950 placeholder:text-emerald-900/60 rounded-xl focus:border-emerald-500 focus:ring-emerald-500'
                                                    value={formik.values.email}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                />
                                            </FieldWrap>
                                        </Validation>

                                        <Validation isValid={formik.isValid} isTouched={formik.touched.password} invalidFeedback={formik.errors.password}>
                                            <FieldWrap
                                                firstSuffix={<Icon icon='HeroLockClosed' className='mx-3 text-emerald-700/70' />}
                                                lastSuffix={
                                                    <button
                                                        type='button'
                                                        aria-label={passwordShowStatus ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                                        className='mx-2 p-1.5 rounded-md hover:bg-emerald-50'
                                                        onClick={() => setPasswordShowStatus(!passwordShowStatus)}>
                                                        <Icon icon={passwordShowStatus ? 'HeroEyeSlash' : 'HeroEye'} className='w-5 h-5 text-emerald-700/80' />
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
                                                    className='bg-white/80 border-emerald-900/20 text-emerald-950 placeholder:text-emerald-900/60 rounded-xl focus:border-emerald-500 focus:ring-emerald-500'
                                                    value={formik.values.password}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                />
                                            </FieldWrap>
                                        </Validation>

                                        <div className='flex items-center justify-between text-sm'>
                                            <label className='flex items-center gap-2 select-none'>
                                                <input type='checkbox' className='rounded border-emerald-900/25 text-emerald-600 focus:ring-emerald-600' />
                                                <span className='text-emerald-900/80'>Recordar cuenta</span>
                                            </label>
                                            <Link to='/recuperar-password' className='text-emerald-700 hover:text-emerald-800 font-medium'>¿Olvidaste tu contraseña?</Link>
                                        </div>

                                        <Button
                                            onClick={() => formik.handleSubmit()}
                                            size='lg'
                                            variant='solid'
                                            className='w-full font-semibold '>
                                            Iniciar sesión
                                        </Button>
                                    </form>

                                    <div className='text-center space-y-2'>
                                        <div className='text-sm text-emerald-900/80'>¿Necesitas ayuda?</div>
                                        <a href='https://ecoti.cl/support/help/3879743613' target='_blank' rel='noopener noreferrer' className='inline-flex items-center text-sm text-emerald-700 hover:text-emerald-800 font-medium'>
                                            <Icon icon='HeroLifebuoy' className='mr-1 w-4 h-4' /> Contactar Soporte Técnico
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Lado visual */}
                            <div className='flex items-center justify-center p-8 lg:p-12 bg-emerald-50/70'>
                                <div className='w-full max-w-md text-center space-y-6'>
                                    <div className='flex justify-center'>
                                        <LogoTemplate className='h-28 w-36 lg:h-36 lg:w-48 drop-shadow-[0_6px_28px_rgba(16,185,129,0.25)]' />
                                    </div>
                                    <div className='space-y-2'>
                                        <Badge className='text-4xl sm:text-5xl text-emerald-700'>Bienvenido.</Badge>
                                        <p className='text-sm sm:text-base lg:text-lg text-emerald-900/90 leading-relaxed px-2'>
                                            Sistema integral de gestión empresarial. Administra tu empresa de manera eficiente y moderna.
                                        </p>
                                    </div>
                                    <div className='flex justify-center items-center gap-8 pt-4'>
                                        <a href='https://ecoti.cl/' target='_blank' rel='noopener noreferrer'
                                            className='group bg-emerald-100 rounded-3xl p-5 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shadow-xl hover:scale-105 hover:shadow-emerald-300/60 transition-all border border-emerald-900/10'>
                                            <img src='/logo-ecotii.png' alt='EcoTi' className='w-16 h-16 object-contain drop-shadow-sm group-hover:scale-110 transition-transform' />
                                        </a>
                                        <a href='https://ecopc.cl/' target='_blank' rel='noopener noreferrer'
                                            className='group bg-emerald-100 rounded-3xl p-5 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shadow-xl hover:scale-105 hover:shadow-emerald-300/60 transition-all border border-emerald-900/10'>
                                            <img src='/logo-ecopc.png' alt='EcoPC' className='w-16 h-16 object-contain drop-shadow-sm group-hover:scale-110 transition-transform' />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* DRAWER MOBILE (FULLSCREEN SOBRE TODO) */}
            {/* overlay */}
            <div
                aria-hidden={!isNavOpen}
                onClick={() => setIsNavOpen(false)}
                className={classNames(
                    'fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden',
                    isNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
            />
            {/* panel */}
            <aside
                role='dialog'
                aria-label='Menú de navegación'
                className={classNames(
                    'fixed top-0 right-0 z-[61] h-full w-[86%] max-w-xs bg-white shadow-2xl border-l border-emerald-900/10 lg:hidden transition-transform duration-300',
                    isNavOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                <div className='flex items-center justify-between p-4 border-b border-black/10'>
                    <div className='flex items-center gap-2'>
                        <LogoTemplate className='h-7 w-8' />
                        <span className='font-bold text-emerald-900'>ZENTRIA</span>
                    </div>
                    <button aria-label='Cerrar menú' onClick={() => setIsNavOpen(false)} className='rounded-md p-2 hover:bg-emerald-50'>
                        <Icon icon='HeroXMark' className='w-6 h-6 text-emerald-900' />
                    </button>
                </div>
                <nav className='p-4 space-y-2'>
                    <Link onClick={() => setIsNavOpen(false)} to='/landing' className='block px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium'>Inicio</Link>
                    <Link onClick={() => setIsNavOpen(false)} to='/recuperar-password' className='block px-4 py-3 rounded-xl hover:bg-emerald-50 text-emerald-900 font-medium'>Recuperar contraseña</Link>
                    <a onClick={() => setIsNavOpen(false)} href='https://ecoti.cl/support/help/3879743613' target='_blank' rel='noopener noreferrer' className='block px-4 py-3 rounded-xl hover:bg-emerald-50 text-emerald-900 font-medium'>Soporte</a>
                    <Button onClick={() => setIsNavOpen(false)} className='w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'>Tickets</Button>
                </nav>
            </aside>
        </PageWrapper>
    );
};

export default LoginPage;
