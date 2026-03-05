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

	// 1) Al montar: si la ruta es privada y no hay token en Redux -> logout + login
	//    Si hay token en Redux, sincroniza hacia tokenManager.
	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;

		if (isPublic) return;

		if (!access) {
			// no hay token persistido -> sesión inválida
			dispatch(logout());
			navigate('/login');
			return;
		}

		// Hay token persistido: sincronizar hacia tokenManager
		tokenManager.setAccessToken(access);
	}, [dispatch, isPublic, navigate, access]);

	// 2) Cargar perfil/permisos una vez por sesión (evita aside vacío)
	useEffect(() => {
		if (isPublic) return;
		if (!isAuthenticated || !access) return;
		// Si ya tenemos usuario cargado no disparamos de nuevo
		if (user && fetchedProfile.current) return;

		fetchedProfile.current = true;
		dispatch(userMeThunk())
			// @ts-ignore: unwrap no siempre tipado
			.unwrap?.()
			.catch(() => {
				// Permitir reintento si falló
				fetchedProfile.current = false;
			});
	}, [dispatch, isAuthenticated, access, isPublic, user]);

	// 2) Si cambia de página a una ruta privada sin estar autenticado, redirigir a /login
	useEffect(() => {
		if (isPublic) return;

		// Aquí puedes usar isAuthenticated o access, según cómo inicializas el estado
		if (!access) {
			navigate('/login');
		}
	}, [access, isPublic, navigate]);

	// 3) Cargar personalización una vez que hay sesión activa
	useEffect(() => {
		if (isPublic) return;
		if (!isAuthenticated) return;
		if (fetchedPersonalization.current) return;

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
	}, [dispatch, isAuthenticated, isPublic]);

	return null;
};

export default AppInitializer;
