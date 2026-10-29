import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import colors from 'tailwindcss/colors';
import { ToastContainer } from 'react-toastify';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AsideRouter from '../components/router/AsideRouter';
import Wrapper from '../components/layouts/Wrapper/Wrapper';
import HeaderRouter from '../components/router/HeaderRouter';
import ContentRouter from '../components/router/ContentRouter';
import FooterRouter from '../components/router/FooterRouter';
import useFontSize from '../hooks/useFontSize';
import useThemeColor from '../hooks/useThemeColor';
import getOS from '../utils/getOS.util';
import 'react-toastify/dist/ReactToastify.css';
import useDarkMode from '../hooks/useDarkMode';
import { logout, obtenerPersonalizacionThunk, useAppDispatch, useAppSelector } from '@/store';
import AppInitializer from '../components/AppInitializer';
import NotificationsStreamProvider from '@/notifications/NotificationsStreamProvider';
import tokenManager from '@/services/auth/tokenManager';
import { useVersion } from '@/hooks/useVersion';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

const App = () => {
	getOS();

	const { fontSize } = useFontSize();
	const { themeColor } = useThemeColor();
	dayjs.extend(localizedFormat);
	const { isDarkTheme } = useDarkMode();

	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { isAuthenticated } = useAppSelector((state) => state.auth);

	const version = useVersion();

	useEffect(() => {
		if (version === 'dev') {
			if (typeof (window as any).removeSplashScreen === 'function') {
				(window as any).removeSplashScreen();
			} else {
				const screen = document.getElementById('splash-screen');
				if (screen) screen.remove();
			}
		}
	}, [version]);

	// nueva validación: solo verificamos en memoria si es válido, sin re-renderizar por cambios en Redux
	// El tokenManager ya está sincronizado por los servicios y el Initializer.
	const hasValidSession = useMemo(() => {
		const token = tokenManager.getAccessToken();
		if (!token) return false;
		return tokenManager.isTokenValid(token) || tokenManager.canRefresh(token);
	}, []); // Empty dependency array: check only on mount/unmount or when component re-renders for other reasons.
	// Actually, we want this to be stable. If we rely on isAuthenticated, we assume valid session.

	// Eliminamos el useEffect redundante de sync access->tokenManager
	// Ya lo hace AppInitializer y el servicio de refresh.

	useEffect(() => {
		const handler = () => dispatch(obtenerPersonalizacionThunk());
		window.addEventListener('org-context-changed', handler);
		return () => window.removeEventListener('org-context-changed', handler);
	}, [dispatch]);

	useEffect(() => {
		if (!isAuthenticated) return;
		// Check validity directly from manager to avoid subscribing to state
		const token = tokenManager.getAccessToken();
		const isValid =
			token && (tokenManager.isTokenValid(token) || tokenManager.canRefresh(token));

		if (!isValid && token) {
			// El token no es válido, pero quizás podemos refrescar silenciosamente.
			// Solo hacemos logout si realmente no hay forma de recuperar.
			import('@/services/BaseService').then(({ triggerTokenRefresh }) => {
				triggerTokenRefresh()
					.then(() => {
						// Token refreshed successfully, force re-render
						dispatch({ type: 'auth/REFRESH_SUCCESS' });
					})
					.catch(() => {
						// Refresh también falló → ahora sí, logout y redirigir
						dispatch(logout());
						navigate('/login', { replace: true });
					});
			});
		} else if (!isValid && !token) {
			dispatch(logout());
			navigate('/login', { replace: true });
		}
	}, [dispatch, isAuthenticated, navigate]);

	const shouldRenderAuthenticatedApp = isAuthenticated; // && hasValidSession is redundant if we trust isAuthenticated + interceptor
	// if (import.meta.env.DEV) {
	// (window as any).tokenManager = tokenManager;
	// }
	return (
		<QueryClientProvider client={queryClient}>
			<ToastContainer theme={isDarkTheme ? 'dark' : 'light'} draggable />

			<style>
				{`:root {font-size: ${fontSize}px;
				  --toastify-toast-bd-radius: 0.75rem;
				  --toastify-color-dark:  ${colors.zinc['800']};
				  --toastify-color-info: ${colors.blue['500']};
				  --toastify-color-success: ${colors.emerald['500']};
				  --toastify-color-warning: ${colors[themeColor]['500']};
				  --toastify-color-error: ${colors.red['500']};
				  --toastify-color-progress-light: linear-gradient(
						to right,
						${colors.blue['500']},
						${colors.emerald['500']},
						${colors[themeColor]['500']},
						${colors.red['500']}
				  );`}
			</style>

			{shouldRenderAuthenticatedApp && (
				<div data-component-name='App' className='flex grow flex-col'>
					<AppInitializer />
					<AsideRouter />
					<Wrapper>
						{/* SSE de notificaciones deshabilitado temporalmente para evitar saturar Redis */}
						{/* <NotificationsStreamProvider> */}
						<HeaderRouter />
						<ContentRouter />
						<FooterRouter />
						{/* <FloatingInfo position='top' size='large' color='red' /> */}
						{/* </NotificationsStreamProvider> */}
					</Wrapper>
				</div>
			)}

			{!shouldRenderAuthenticatedApp && (
				<div data-component-name='App' className='flex grow flex-col'>
					<AsideRouter />
					<Wrapper>
						<HeaderRouter />
						<ContentRouter />
						<FooterRouter />
					</Wrapper>
				</div>
			)}
		</QueryClientProvider>
	);
};

export default App;
