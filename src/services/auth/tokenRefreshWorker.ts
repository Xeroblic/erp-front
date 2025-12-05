import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import tokenManager from './tokenManager';
import { triggerTokenRefresh } from '@/services/BaseService';
import { logout } from '@/store/slices/auth/authSlice';

const RAW_MARGIN_SECONDS =
	Number(import.meta.env.VITE_JWT_REFRESH_MARGIN_SECONDS || '15') || 15;
const MIN_MARGIN_SECONDS = 5;
const MIN_WAIT_MS = 5_000;

let refreshTimeout: number | null = null;
let initialized = false;

const clearScheduledRefresh = () => {
	if (refreshTimeout) {
		window.clearTimeout(refreshTimeout);
		refreshTimeout = null;
	}
};

const scheduleNextRefresh = (store: Store<RootState>, token: string) => {
	if (typeof window === 'undefined') {
		return;
	}

	const remainingMs = tokenManager.getTokenTimeRemaining(token);
	const desiredMarginMs = Math.max(RAW_MARGIN_SECONDS, MIN_MARGIN_SECONDS) * 1000;
	const maxMarginMs = Math.max(remainingMs - MIN_WAIT_MS, 0);
	const marginMs = Math.min(desiredMarginMs, maxMarginMs);

	if (remainingMs <= 0) {
		return;
	}

	if (!tokenManager.canRefresh(token)) {
		return;
	}

	const delay = Math.max(remainingMs - marginMs, MIN_WAIT_MS);
	clearScheduledRefresh();
	refreshTimeout = window.setTimeout(() => backgroundRefresh(store), delay);
};

const backgroundRefresh = async (store: Store<RootState>) => {
	const state = store.getState();
	if (!state.auth.isAuthenticated) {
		clearScheduledRefresh();
		return;
	}
	const currentToken = tokenManager.getAccessToken() ?? state.auth.access;

	if (!currentToken) {
		clearScheduledRefresh();
		return;
	}

	// Si el token ya expiró por completo, no intentamos refrescar en background,
	// dejamos que el interceptor maneje el 401 o el usuario haga login.
	if (!tokenManager.isTokenValid(currentToken)) {
		clearScheduledRefresh();
		// Opcional: Logout proactivo si sabemos que está expirado
		// store.dispatch(logout());
		// tokenManager.clearTokens();
		return;
	}

	if (!tokenManager.canRefresh(currentToken)) {
		clearScheduledRefresh();
		// Si no se puede refrescar (porque pasó el tiempo de vida del refresh), logout.
		store.dispatch(logout());
		tokenManager.clearTokens();
		return;
	}

	try {
		const newToken = await triggerTokenRefresh(currentToken);
		tokenManager.setAccessToken(newToken);
		scheduleNextRefresh(store, newToken);
	} catch (error) {
		clearScheduledRefresh();
		if (process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line no-console
			console.error('Error en el refresh automático del token', error);
		}
		// No hacemos logout aquí automáticamente para ser resilientes a fallos de red transitorios.
		// El interceptor se encargará si una petición real falla con 401.
	}
};

export const initTokenRefreshWorker = (store: Store<RootState>) => {
	if (initialized || typeof window === 'undefined') {
		return;
	}
	initialized = true;

	let lastToken: string | undefined;

	const syncFromStore = () => {
		const state = store.getState();
		const { isAuthenticated, access } = state.auth;
		const candidateToken = tokenManager.getAccessToken() ?? access ?? undefined;

		if (!isAuthenticated || !candidateToken) {
			lastToken = undefined;
			clearScheduledRefresh();
			return;
		}

		if (candidateToken === lastToken) {
			return;
		}

		lastToken = candidateToken;

		scheduleNextRefresh(store, candidateToken);
	};

	store.subscribe(syncFromStore);
	syncFromStore();
};

export default initTokenRefreshWorker;
