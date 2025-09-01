import Input from '@/components/form/Input';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Button from '@/components/ui/Button';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import axios from 'axios';
import { useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import Card, { CardBody } from '@/components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '@/components/icon/Icon';
import classNames from 'classnames';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Correo electrónico no válido').required('Correo electrónico es requerido'),
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
        await axios.post('http://127.0.0.1:8000/auth/users/reset_password/', { email: values.email });
        toast.success('Enlace de restablecimiento de contraseña enviado a tu correo.');
        setIsFormSubmitted(true);
      } catch (error) {
        toast.error('Error al enviar el enlace de restablecimiento de contraseña.');
      }
    },
  });

  return (
    <PageWrapper isProtectedRoute={false} className="min-h-screen" name="Recuperar Contraseña">
      {/* Fondo clarito en verdes */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500" />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="relative z-0 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <Card className="w-full max-w-3xl bg-white/75 backdrop-blur-xl border border-emerald-900/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header dentro de la card (mismo estilo que login) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/70 border-b border-emerald-900/10">
            <div className="flex items-center gap-2">
              <LogoTemplate className="h-8 w-10" />
              <span className="text-emerald-900 font-extrabold text-lg sm:text-xl tracking-wide">ZENTRIA</span>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/login" className="px-3 py-2 text-emerald-950/80 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg font-medium transition-colors">
                Volver a iniciar sesión
              </Link>
            </div>
            {/* botón mobile opcional */}
            <div className="sm:hidden">
              <button
                aria-label="Abrir menú"
                onClick={() => setIsNavOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-emerald-900/15 bg-white/80 hover:bg-white p-2"
              >
                <Icon icon="HeroBars3" className="w-6 h-6 text-emerald-900" />
              </button>
            </div>
          </div>

          <CardBody className="p-0">
            {/* Contenido principal */}
            <div className="p-6 sm:p-8 lg:p-10">
              {!isFormSubmitted ? (
                <div className="max-w-md mx-auto">
                  <div className="text-center space-y-2 mb-6">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-800">Recuperar contraseña</h1>
                    <p className="text-emerald-900/80">
                      Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                  </div>

                  <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-emerald-900/90 font-medium">
                        <Icon icon="HeroEnvelope" className="w-5 h-5" />
                        Correo electrónico
                      </div>
                      <Input
                        ref={emailRef}
                        type="email"
                        name="email"
                        placeholder="tu@correo.com"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={classNames(
                          'w-full bg-white/80 border-emerald-900/20 text-emerald-950 placeholder:text-emerald-900/60 rounded-xl focus:border-emerald-500 focus:ring-emerald-500',
                        )}
                      />
                      {formik.errors.email && formik.touched.email && (
                        <div className="mt-2 text-sm text-red-600">{formik.errors.email}</div>
                      )}
                    </div>

                    <Button
                      onClick={() => formik.handleSubmit()}
                      className="w-full font-semibold text-white rounded-xl py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    >
                      Enviar enlace de restablecimiento
                    </Button>

                    <div className="text-center">
                      <Link to="/login" className="text-emerald-700 hover:text-emerald-800 font-medium">
                        Volver a iniciar sesión
                      </Link>
                    </div>
                  </form>
                </div>
              ) : (
                // Estado de éxito (misma estética)
                <div className="max-w-md mx-auto text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-emerald-400 bg-emerald-50 shadow">
                      <Icon icon="HeroCheckCircle" className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-semibold text-emerald-800">Correo enviado</h2>
                  <p className="text-emerald-900/85">
                    Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
                    Si no lo ves, mira en “Spam” o “Promociones”.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full font-semibold text-white rounded-xl py-3 bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
                    >
                      Ir al login
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsFormSubmitted(false)}
                      className="w-full rounded-xl py-3 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                    >
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
          isNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      />
      <aside
        role="dialog"
        aria-label="Menú de navegación"
        className={classNames(
          'fixed top-0 right-0 z-[61] h-full w-[86%] max-w-xs bg-white shadow-2xl border-l border-emerald-900/10 sm:hidden transition-transform duration-300',
          isNavOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/10">
          <div className="flex items-center gap-2">
            <LogoTemplate className="h-7 w-8" />
            <span className="font-bold text-emerald-900">ZENTRIA</span>
          </div>
          <button aria-label="Cerrar menú" onClick={() => setIsNavOpen(false)} className="rounded-md p-2 hover:bg-emerald-50">
            <Icon icon="HeroXMark" className="w-6 h-6 text-emerald-900" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <Link onClick={() => setIsNavOpen(false)} to="/login" className="block px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-medium">
            Volver al login
          </Link>
          <a
            onClick={() => setIsNavOpen(false)}
            href="https://ecoti.cl/support/help/3879743613"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 rounded-xl hover:bg-emerald-50 text-emerald-900 font-medium"
          >
            Soporte
          </a>
        </nav>
      </aside>
    </PageWrapper>
  );
};

export default RecuperarPassword;
