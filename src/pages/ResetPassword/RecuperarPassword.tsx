import Input from '@/components/form/Input';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Button from '@/components/ui/Button';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import axios from 'axios';
import { useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Card from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';


const validationSchema = Yup.object().shape({
  email: Yup.string().email('Correo electrónico no válido').required('Correo electrónico es requerido'),
});

const RecuperarPassword = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await axios.post('http://127.0.0.1:8000/auth/users/reset_password/', { email: values.email });
        toast.success('Enlace de restablecimiento de contraseña enviado a tu correo.');
        setIsFormSubmitted(true);
      } catch (error) {
        toast.error('Error al enviar el enlace de restablecimiento de contraseña.');
      }
    },
  });

  return (
    <PageWrapper isProtectedRoute={false} className='bg-white dark:bg-inherit' name='Recuperar Contraseña'>
      <div className='container mx-auto flex h-full items-center justify-center relative'>
        <Card className={`flex flex-col gap-8 p-6 bg-gray-100 rounded-lg shadow-lg dark:bg-gray-800 transition-all duration-500 ${isFormSubmitted ? 'hidden' : 'block'}`}>
          <div className='flex justify-center'>
            <LogoTemplate className='h-12' />
          </div>
          <div className='text-center'>
            <span className='text-4xl font-semibold text-gray-900 dark:text-gray-100'>Recuperar Contraseña</span>
          </div>
          <form className='flex flex-col gap-4' onSubmit={formik.handleSubmit}>
            <Input
              ref={emailRef}
              type="email"
              name="email"
              placeholder="Ingresa tu correo"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`w-full p-2 border ${formik.errors.email && formik.touched.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
            />
            {formik.errors.email && formik.touched.email && <div className='text-red-500'>{formik.errors.email}</div>}
            <Button
              onClick={() => formik.handleSubmit()}
              variant='solid'
              className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              Enviar enlace de restablecimiento
            </Button>
          </form>
          {message && <p className='text-center text-red-500'>{message}</p>}
        </Card>
        {isFormSubmitted && (
          <Card className='flex flex-col gap-8 p-6 bg-gray-100 rounded-lg shadow-lg dark:bg-gray-800 animate-fade-in'>
            <div className='flex justify-center'>
              <LogoTemplate className='h-12' />
            </div>
            <div className='text-center'>
              <span className='text-4xl font-semibold text-gray-900 dark:text-gray-100'>Correo Enviado</span>
            </div>
            <div className='flex justify-center'>
              <img src='/public/images/all/check.png' alt='Check' className='h-25' />
            </div>
            <p className='text-center text-gray-700 dark:text-gray-300'>
              Revisa tu correo electrónico para el enlace de restablecimiento de contraseña.
            </p>
            <Button
              onClick={() => navigate('/login')}
              variant='solid'
              className='w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              Ir al Login
            </Button>
          </Card>
        )}
      </div>
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </PageWrapper>
  );
};

export default RecuperarPassword;
