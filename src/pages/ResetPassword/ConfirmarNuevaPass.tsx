import Input from '@/components/form/Input';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Button from '@/components/ui/Button';
import LogoTemplate from '@/templates/layouts/Logo/Logo.template';
import axios from 'axios';
import { useFormik } from 'formik';
import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import classNames from 'classnames';

const validationSchema = Yup.object().shape({
  new_password: Yup.string()
    .min(8, 'Mínimo 8 caracteres')
    .required('La nueva contraseña es obligatoria'),
  re_new_password: Yup.string()
    .oneOf([Yup.ref('new_password')], 'Las contraseñas no coinciden')
    .required('La confirmación de la contraseña es obligatoria'),
});

const ConfirmarNuevaPass = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  const newPasswordRef = useRef<HTMLInputElement>(null);
  const reNewPasswordRef = useRef<HTMLInputElement>(null);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formik = useFormik({
    initialValues: {
      new_password: '',
      re_new_password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
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
    <PageWrapper isProtectedRoute={false} className="min-h-screen" name="Confirmar Contraseña">
      {/* Fondo verde clarito como el login */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-emerald-300 to-emerald-500" />
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] [background-size:18px_18px]" />
      </div>

      <div className="relative z-0 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <Card className="w-full max-w-3xl bg-white/75 backdrop-blur-xl border border-emerald-900/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header dentro de la card */}
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
          </div>

          <CardBody className="p-0">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="max-w-md mx-auto">
                <div className="text-center space-y-2 mb-6">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-emerald-800">Nueva contraseña</h1>
                  <p className="text-emerald-900/80">
                    Crea una contraseña segura y confírmala para completar el proceso.
                  </p>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>
                  {/* Nueva contraseña */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-900/90 font-medium">
                      <Icon icon="HeroLockClosed" className="w-5 h-5" />
                      Nueva contraseña
                    </div>
                    <div className="relative">
                      <Input
                        ref={newPasswordRef}
                        type={showNew ? 'text' : 'password'}
                        name="new_password"
                        placeholder="••••••••"
                        value={formik.values.new_password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={classNames(
                          'w-full bg-white/80 border-emerald-900/20 text-emerald-950 placeholder:text-emerald-900/60 rounded-xl focus:border-emerald-500 focus:ring-emerald-500'
                        )}
                      />
                      <button
                        type="button"
                        aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute inset-y-0 right-2 my-1.5 px-2 rounded-md hover:bg-emerald-50"
                      >
                        <Icon icon={showNew ? 'HeroEyeSlash' : 'HeroEye'} className="w-5 h-5 text-emerald-700/80" />
                      </button>
                    </div>
                    {formik.touched.new_password && formik.errors.new_password && (
                      <div className="mt-2 text-sm text-red-600">{formik.errors.new_password}</div>
                    )}
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-900/90 font-medium">
                      <Icon icon="HeroCheck" className="w-5 h-5" />
                      Confirmar contraseña
                    </div>
                    <div className="relative">
                      <Input
                        ref={reNewPasswordRef}
                        type={showConfirm ? 'text' : 'password'}
                        name="re_new_password"
                        placeholder="••••••••"
                        value={formik.values.re_new_password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={classNames(
                          'w-full bg-white/80 border-emerald-900/20 text-emerald-950 placeholder:text-emerald-900/60 rounded-xl focus:border-emerald-500 focus:ring-emerald-500'
                        )}
                      />
                      <button
                        type="button"
                        aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute inset-y-0 right-2 my-1.5 px-2 rounded-md hover:bg-emerald-50"
                      >
                        <Icon icon={showConfirm ? 'HeroEyeSlash' : 'HeroEye'} className="w-5 h-5 text-emerald-700/80" />
                      </button>
                    </div>
                    {formik.touched.re_new_password && formik.errors.re_new_password && (
                      <div className="mt-2 text-sm text-red-600">{formik.errors.re_new_password}</div>
                    )}
                  </div>

                  {/* Ayuda breve */}
                  <p className="text-xs text-emerald-900/70">
                    Consejo: usa al menos 8 caracteres. Mezcla letras y números para mayor seguridad.
                  </p>

                  {/* CTA */}
                  <Button
                    onClick={() => formik.handleSubmit()}
                    className="w-full font-semibold text-white rounded-xl py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    Guardar nueva contraseña
                  </Button>

                  <div className="text-center">
                    <Link to="/login" className="text-emerald-700 hover:text-emerald-800 font-medium">
                      Volver a iniciar sesión
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default ConfirmarNuevaPass;
