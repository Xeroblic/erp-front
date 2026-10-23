import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import reportWebVitals from './reportWebVitals';

import { ThemeContextProvider } from './context/themeContext';
// import { AuthProvider } from './context/authContext';

import App from './App/App';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';

import './i18n';
import './styles/index.css';
import './components/customCss/nav-anim.css';

import store, { persistor } from './store';

// Inicializar slice de personalización dinámicamente
import './store/initializePersonalizacion';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	// <React.StrictMode>
	<ErrorBoundary>
		<Provider store={store}>
			<PersistGate
				loading={<LoadingScreen message='Inicializando aplicación...' />}
				persistor={persistor}>
				<ThemeContextProvider>
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</ThemeContextProvider>
			</PersistGate>
		</Provider>
	</ErrorBoundary>,
	// </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
