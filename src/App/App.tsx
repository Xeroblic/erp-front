import localizedFormat from 'dayjs/plugin/localizedFormat';
import dayjs from 'dayjs';
import colors from 'tailwindcss/colors';
import AsideRouter from '../components/router/AsideRouter';
import Wrapper from '../components/layouts/Wrapper/Wrapper';
import HeaderRouter from '../components/router/HeaderRouter';
import ContentRouter from '../components/router/ContentRouter';
import FooterRouter from '../components/router/FooterRouter';
import useFontSize from '../hooks/useFontSize';
import useThemeColor from '../hooks/useThemeColor';
import getOS from '../utils/getOS.util';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useDarkMode from '../hooks/useDarkMode';
import { obtenerPersonalizacionThunk, useAppDispatch, useAppSelector } from '@/store';
import AppInitializer from '../components/AppInitializer';
// import PersonalizacionDebug from '../components/debug/PersonalizacionDebug';
import NotificationsStreamProvider from '@/notifications/NotificationsStreamProvider';
import { useEffect } from 'react';
// import PersonalizacionTest from '../components/test/PersonalizacionTest';
// import DarkModeDebug from '../components/debug/DarkModeDebug';
// import DarkModeStatus from '../components/debug/DarkModeStatus';
// import BackendSimulator from '../components/debug/BackendSimulator';

const App = () => {
	getOS();

	const { fontSize } = useFontSize();
	const { themeColor } = useThemeColor();
	dayjs.extend(localizedFormat);
	const { isDarkTheme } = useDarkMode();

	// Redux hooks para verificar autenticación
	const dispatch = useAppDispatch();
	const { isAuthenticated, access } = useAppSelector((state) => state.auth);

	useEffect(() => {
		const handler = () => {
			dispatch(obtenerPersonalizacionThunk());
		};

		window.addEventListener('user-branch-changed', handler);
		return () => window.removeEventListener('user-branch-changed', handler);
	}, [dispatch]);

	return (
		<>
			{/* <DarkModeDebug /> */}
			{/* <DarkModeStatus /> */}
			<ToastContainer theme={isDarkTheme ? 'dark' : 'light'} draggable></ToastContainer>
			{/* <PersonalizacionDebug /> */}
			{/* <PersonalizacionTest /> */}
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
					${colors.red['500']});`}
			</style>
			{isAuthenticated && (
				<div data-component-name='App' className='flex grow flex-col'>
					{/* <AuthDebug /> */}
					{/* <UserDataSimulator /> */}
					{/* <BackendSimulator /> */}
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
			{!isAuthenticated && (
				<div data-component-name='App' className='flex grow flex-col'>
					{/* <AuthDebug /> */}
					{/* <UserDataSimulator /> */}
					{/* <BackendSimulator /> */}
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
