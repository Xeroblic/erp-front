import Input from '@/components/form/Input';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Button from '@/components/ui/Button';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import axios from 'axios';
import { useFormik } from 'formik';
import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
    new_password: Yup.string().required('La nueva contraseña es obligatoria'),
    re_new_password: Yup.string().required('La confirmación de la contraseña es obligatoria'),
});

const ConfirmarNuevaPass = () => {
    const { uid, token } = useParams<{ uid: string; token: string }>();
    const navigate = useNavigate();
    const newPassword = useRef<HTMLInputElement>(null);
    const reNewPassword = useRef<HTMLInputElement>(null);
    const [message, setMessage] = useState('');

    const formik = useFormik({
        initialValues: {
            new_password: '',
            re_new_password: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            if (values.new_password !== values.re_new_password) {
                setMessage('Las contraseñas no coinciden.');
                return;
            }
            try {
                await axios.post('http://127.0.0.1:8000/auth/users/reset_password_confirm/', {
                    uid,
                    token,
                    new_password: values.new_password,
                    re_new_password: values.re_new_password,
                });
                toast.success('Contraseña restablecida con éxito.');
                navigate('/login'); 
            } catch (error) {
                toast.error('Error al restablecer la contraseña.');
            }
        },
    });

    return (
        <PageWrapper isProtectedRoute={false} className='bg-white dark:bg-inherit' name='Confirmar Contraseña'>
            <div className='container mx-auto flex h-full items-center justify-center'>
                <div className='flex max-w-sm flex-col gap-8 p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-800'>
                    <div className='flex justify-center'>
                        <LogoTemplate className='h-12' />
                    </div>
                    <div className='text-center'>
                        <span className='text-4xl font-semibold text-gray-900 dark:text-gray-100'>Recuperar Contraseña</span>
                    </div>
                    <form onSubmit={formik.handleSubmit} className='flex flex-col gap-4'>
                        <Input
                            ref={newPassword}
                            type="password"
                            name="new_password"
                            placeholder={'Nueva contraseña'}
                            value={formik.values.new_password}
                            onBlur={formik.handleBlur}
                            onChange={formik.handleChange}
                            className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                        />
                        <Input
                            ref={reNewPassword}
                            type="password"
                            name="re_new_password"
                            placeholder={'Confirmar nueva contraseña'}
                            value={formik.values.re_new_password}
                            onBlur={formik.handleBlur}
                            onChange={formik.handleChange}
                            className='w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                        />
                        {formik.touched.new_password && formik.errors.new_password ? (
                            <div className="text-red-500 text-sm">{formik.errors.new_password}</div>
                        ) : null}
                        {formik.touched.re_new_password && formik.errors.re_new_password ? (
                            <div className="text-red-500 text-sm">{formik.errors.re_new_password}</div>
                        ) : null}

                        <Button variant='solid'
                            onClick={() => formik.handleSubmit()}
                            className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            Reset Password
                        </Button>
                    </form>
                    {message && <p className="text-red-500 text-sm">{message}</p>}
                </div>
            </div>
        </PageWrapper>
    );
};

export default ConfirmarNuevaPass;
