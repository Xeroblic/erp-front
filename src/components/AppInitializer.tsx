import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '../store';
import { logout, setToken, userMeThunk } from '@/store/slices/auth/authSlice';
import { obtenerPersonalizacionThunk } from '@/store/slices/personalizacion/personalizacionSlice';
import tokenManager from '@/services/auth/tokenManager';

const AppInitializer = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const { isAuthenticated, access, user } = useAppSelector((s) => s.auth);
	const hasInitialized = useRef(false);
	const fetchedPersonalization = useRef(false);
	const fetchedProfile = useRef(false);

	const publicRoutes = useMemo(
		() => [
			'/login',
			'/recuperar-password',
			'/reset-password',
			'/usuarios/activar',
			'/invitar/aceptar',
		],
		[],
	);
	const isPublic =
		publicRoutes.includes(location.pathname) || location.pathname.startsWith('/portal-pedidos');

	// Consolidar lógica de inicialización y redirección en un solo useEffect
	// para evitar condiciones de carrera entre múltiples navegaciones
	useEffect(() => {
		// Siempre permitir rutas públicas
		if (isPublic) return;

		// Si no hay token en Redux, limpiar y redirigir a login
		if (!access) {
			dispatch(logout());
			navigate('/login', { replace: true });
			return;
		}

		// Hay token, sincronizar con tokenManager
		tokenManager.setAccessToken(access);

		// Cargar perfil solo una vez por sesión
		if (isAuthenticated && (!user || !fetchedProfile.current)) {
			fetchedProfile.current = true;
			dispatch(userMeThunk())
				// @ts-ignore: unwrap no siempre tipado
				.unwrap?.()
				.catch(() => {
					// Permitir reintento si falló
					fetchedProfile.current = false;
				});
		}

		// Cargar personalización una vez que hay sesión activa
		if (isAuthenticated && !fetchedPersonalization.current) {
			fetchedPersonalization.current = true;
			dispatch(obtenerPersonalizacionThunk())
				// @ts-ignore por si unwrap no está tipado
				.unwrap?.()
				.catch((error: any) => {
					const rawMessage = typeof error === 'string' ? error : error?.message;
					const shouldSilence =
						typeof rawMessage === 'string' &&
						rawMessage.toLowerCase().includes('no autentic');
					if (!shouldSilence) {
						toast.error('Error cargando personalización');
					}
					fetchedPersonalization.current = false;
				});
		}
	}, [dispatch, isAuthenticated, access, isPublic, navigate, user]);

	return null;
};

export default AppInitializer;
