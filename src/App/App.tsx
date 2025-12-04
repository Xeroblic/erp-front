import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import colors from 'tailwindcss/colors';
import { ToastContainer } from 'react-toastify';
import { useEffect, useMemo } from 'react';
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

const App = () => {
	getOS();

	const { fontSize } = useFontSize();
	const { themeColor } = useThemeColor();
	dayjs.extend(localizedFormat);
	const { isDarkTheme } = useDarkMode();

	const dispatch = useAppDispatch();
	const { isAuthenticated, access } = useAppSelector((state) => state.auth);

	useEffect(() => {
		if (access) {
			tokenManager.setAccessToken(access);
		} else {
			tokenManager.clearTokens();
		}
	}, [access]);
	// nueva validación
	const hasValidSession = useMemo(() => {
		const token = access ?? tokenManager.getAccessToken();
		if (!token) return false;
		return tokenManager.isTokenValid(token) || tokenManager.canRefresh(token);
	}, [access]);

	useEffect(() => {
		const handler = () => dispatch(obtenerPersonalizacionThunk());
		window.addEventListener('user-branch-changed', handler);
		return () => window.removeEventListener('user-branch-changed', handler);
	}, [dispatch]);

	useEffect(() => {
		if (!isAuthenticated) return;
		if (!hasValidSession) {
			dispatch(logout());
		}
	}, [dispatch, hasValidSession, isAuthenticated]);

	const shouldRenderAuthenticatedApp = isAuthenticated && hasValidSession;
	// if (import.meta.env.DEV) {
	// (window as any).tokenManager = tokenManager;
	// }
	return (
		<>
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
						<NotificationsStreamProvider>
							<HeaderRouter />
							<ContentRouter />
							<FooterRouter />
						</NotificationsStreamProvider>
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
		</>
	);
};

export default App;
