import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import reportWebVitals from './reportWebVitals';

import { ThemeContextProvider } from './context/themeContext';
// import { AuthProvider } from './context/authContext';

import App from './App/App';

import './i18n';
import './styles/index.css';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './styles/vendors.css';
import './components/customCss/nav-anim.css';

import store, { persistor } from './store';

// Inicializar slice de personalización dinámicamente
import './store/initializePersonalizacion';

// Fallback para entornos que no exponen useSyncExternalStore en React (algunas lib usan el hook)

if (!(React as any).useSyncExternalStore) {
	(React as any).useSyncExternalStore = useSyncExternalStore;
}
if (!(React as any).useSyncExternalStoreWithSelector) {
	(React as any).useSyncExternalStoreWithSelector = useSyncExternalStoreWithSelector;
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	// <React.StrictMode>
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<ThemeContextProvider>
				<BrowserRouter
					future={{
						v7_startTransition: true,
						v7_relativeSplatPath: true,
					}}>
					<App />
				</BrowserRouter>
			</ThemeContextProvider>
		</PersistGate>
	</Provider>,
	// </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
