import { configureStore, Action, Reducer, AnyAction, Store } from '@reduxjs/toolkit';
import {
	persistStore,
	persistReducer,
	FLUSH,
	REHYDRATE,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { PERSIST_STORE_NAME } from '@/constants/app.constant';
import rootReducer, { RootState, AsyncReducers } from './rootReducer';
import RtkQueryService from '@/services/RtkQueryService';
import tokenManager from '@/services/auth/tokenManager';
import { logout, setToken } from './slices/auth/authSlice';
import { initTokenRefreshWorker } from '@/services/auth/tokenRefreshWorker';

/* eslint-disable @typescript-eslint/no-explicit-any */
const middlewares: any[] = [RtkQueryService.middleware];

const persistConfig = {
	key: PERSIST_STORE_NAME,
	keyPrefix: '',
	storage,
	whitelist: ['auth', 'core'],
};

interface CustomStore extends Store<RootState, AnyAction> {
	asyncReducers?: AsyncReducers;
}

const store: CustomStore = configureStore({
	reducer: persistReducer(persistConfig, rootReducer() as Reducer),
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			immutableCheck: false,
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}).concat(middlewares),
	devTools: process.env.NODE_ENV === 'development',
});

store.asyncReducers = {};

// Exponer el store globalmente para acceso desde themeConfig
if (typeof window !== 'undefined') {
	(window as any).__REDUX_STORE__ = store;
}

export const persistor = persistStore(store);

type PersistedAuthState = {
	access?: string;
};

const parsePersistedAuthState = (rawValue: string | null): PersistedAuthState | null => {
	if (!rawValue) return null;
	try {
		const parsedRoot = JSON.parse(rawValue);
		if (!parsedRoot?.auth) return null;
		return JSON.parse(parsedRoot.auth) as PersistedAuthState;
	} catch (error) {
		if (process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line no-console
			console.warn('No se pudo sincronizar el estado de auth entre pestañas', error);
		}
		return null;
	}
};

const setupCrossTabAuthSync = () => {
	if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
		return;
	}

	const syncAuthState = (event: StorageEvent) => {
		if (event.key !== PERSIST_STORE_NAME) return;

		const nextAuthState = parsePersistedAuthState(event.newValue);
		const currentToken = tokenManager.getAccessToken() ?? store.getState().auth.access;

		if (!nextAuthState?.access) {
			// Otra pestaña borró el token del storage.
			// Caso A: Logout voluntario → tokenManager local también estará vacío
			//         porque logoutThunk hace clearTokens() ANTES de limpiar storage.
			// Caso B: Pestaña de fondo falló → el token local podría seguir siendo válido.

			if (!currentToken) {
				// Caso A: Logout real. Propagar.
				store.dispatch(logout());
				return;
			}

			// Caso B: Verificar si nuestro token local sigue siendo válido.
			if (tokenManager.isTokenValid(currentToken)) {
				// Nuestro token es válido. No matamos la sesión.
				// Re-escribimos el token en Redux/persist para "revivir" a las otras pestañas.
				store.dispatch(setToken({ access: currentToken }));
				return;
			}

			// El token local también está expirado. Propagar logout.
			store.dispatch(logout());
			tokenManager.clearTokens();
			return;
		}

		if (nextAuthState.access === currentToken) {
			return;
		}

		tokenManager.setAccessToken(nextAuthState.access);
		store.dispatch(setToken({ access: nextAuthState.access }));
	};

	window.addEventListener('storage', syncAuthState);
};

setupCrossTabAuthSync();
initTokenRefreshWorker(store);

export function injectReducer<S>(key: string, reducer: Reducer<S, Action>) {
	if (store.asyncReducers) {
		if (store.asyncReducers[key]) {
			return false;
		}
		store.asyncReducers[key] = reducer;
		store.replaceReducer(
			persistReducer(persistConfig, rootReducer(store.asyncReducers) as Reducer),
		);
	}
	persistor.persist();
	return store;
}

export type AppDispatch = typeof store.dispatch;

export default store;
