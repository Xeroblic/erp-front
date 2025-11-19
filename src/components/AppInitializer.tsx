import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { validateSession } from '../store/slices/auth/authSlice';
import { obtenerPersonalizacionThunk } from '../store/slices/personalizacion/personalizacionSlice';
import { toast } from 'react-toastify';

const AppInitializer = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, access } = useAppSelector((s) => s.auth);
  const personalizacion = useAppSelector((s) => s.personalizacion);
  const hasInitialized = useRef(false);
  const fetchedPersonalization = useRef(false);

const publicRoutes = useMemo(
  () => ['/login', '/recuperar-password', '/reset-password', '/usuarios/activar'],
  []
);

  const isPublic = publicRoutes.includes(location.pathname);

  // Validar sesión una sola vez (si no es ruta pública)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    if (isPublic) return;
    dispatch(validateSession());
  }, [dispatch, isPublic]);

  // Redirección si no autenticado (en rutas privadas)
  useEffect(() => {
    if (isPublic) return;
    if (!isAuthenticated || !access) {
      navigate('/login');
    }
  }, [isAuthenticated, access, isPublic, navigate]);

  // Cargar personalización SOLO una vez cuando ya esté autenticado
  useEffect(() => {
    if (isPublic) return;
    if (!isAuthenticated || !access) return;
    if (fetchedPersonalization.current) return;

    fetchedPersonalization.current = true;
    dispatch(obtenerPersonalizacionThunk())
      .unwrap?.()
      .catch((err: any) => {
        console.error('Error al cargar personalización:', err);
        toast.error('Error al cargar la personalización del usuario');
        // Si falló, permite reintentar en el futuro:
        fetchedPersonalization.current = false;
      });
  }, [dispatch, isAuthenticated, access, isPublic]);

  return null;
};

export default AppInitializer;
