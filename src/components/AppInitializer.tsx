import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logout, setToken, validateSession } from '../store/slices/auth/authSlice';
import { obtenerPersonalizacionThunk } from '../store/slices/personalizacion/personalizacionSlice';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import tokenManager, { ACCESS_TOKEN_REFRESH_LEEWAY_MS } from '@/services/auth/tokenManager';

const AppInitializer = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const { isAuthenticated, access } = useAppSelector((s) => s.auth);
	const personalizacion = useAppSelector((s) => s.personalizacion);
	const hasInitialized = useRef(false);
	const fetchedPersonalization = useRef(false);
	const refreshTimerRef = useRef<number | null>(null);

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
	const isPublic = publicRoutes.includes(location.pathname);

	useEffect(() => {
		if (hasInitialized.current) return;
		hasInitialized.current = true;
		if (isPublic) return;
		dispatch(validateSession());
	}, [dispatch, isPublic]);

	useEffect(() => {
		if (isPublic) return;
		if (!access) {
			navigate('/login');
		}
	}, [access, isPublic, navigate]);

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

	useEffect(() => {
		if (isPublic) return;
		if (!isAuthenticated || !access) return;

		let stopped = false;

		const schedule = (delayMs: number) => {
			refreshTimerRef.current = window.setTimeout(tick, delayMs);
		};

		const tick = async () => {
			if (stopped) return;

			const token = tokenManager.getAccessToken();
			if (!token) {
				dispatch(logout());
				navigate('/login');
				return;
			}

			if (!tokenManager.isAccessTokenExpiring(ACCESS_TOKEN_REFRESH_LEEWAY_MS)) {
				schedule(45_000);
				return;
			}

			try {
				const resp = await ApiService.fetchData<{ token: string; expires_in?: number } | any>({
					url: '/refresh',
					method: 'post',
					headers: { Authorization: `Bearer ${token}` },
					dedupe: true,
				});

				const data: any = resp?.data ?? {};
				const newToken = data.token ?? data.access;
				if (!newToken) throw new Error('Refresh sin token');

				const expiresInSeconds =
					typeof data.expires_in === 'number'
						? data.expires_in
						: typeof data?.data?.expires_in === 'number'
							? data.data.expires_in
							: undefined;
				const accessExpiresAt = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined;

				tokenManager.persistTokens({ accessToken: newToken, accessExpiresAt });
				dispatch(setToken({ access: newToken, markActivity: true }));
			} catch (err: any) {
				const status = err?.response?.status;
				if (status === 401 || status === 403) {
					dispatch(logout());
					navigate('/login');
					return;
				}
				console.error('Error en refresh proactivo:', err);
				toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
				dispatch(logout());
				navigate('/login');
				return;
			}

			schedule(45_000);
		};

		tick(); // primer intento inmediato para cubrir recargas con token vencido

		return () => {
			stopped = true;
			if (refreshTimerRef.current) {
				clearTimeout(refreshTimerRef.current);
				refreshTimerRef.current = null;
			}
		};
	}, [isPublic, isAuthenticated, access, dispatch, navigate]);

	return null;
};

export default AppInitializer;
