import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import tokenManager from './tokenManager';
import { triggerTokenRefresh } from '@/services/BaseService';

const RAW_MARGIN_SECONDS =
	Number(import.meta.env.VITE_JWT_REFRESH_MARGIN_SECONDS || '120') || 120;
const MIN_MARGIN_SECONDS = 30;
const MIN_WAIT_MS = 5_000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000];

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

/**
 * Determina si el token está en la "zona de peligro": le queda menos
 * tiempo del margen de seguridad configurado.
 */
const isInDangerZone = (token: string): boolean => {
	const remainingMs = tokenManager.getTokenTimeRemaining(token);
	const marginMs = Math.max(RAW_MARGIN_SECONDS, MIN_MARGIN_SECONDS) * 1000;
	return remainingMs > 0 && remainingMs <= marginMs;
};

const backgroundRefresh = async (store: Store<RootState>, retryCount = 0) => {
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

	// Si el token ya expiró por completo, intentamos refrescar de todas formas
	// siempre y cuando estemos dentro de la ventana de refresh.
	// El interceptor se encargará si realmente no se puede.
	if (!tokenManager.canRefresh(currentToken)) {
		clearScheduledRefresh();
		// NO hacemos logout aquí. Dejamos que el interceptor maneje el 401
		// cuando el usuario haga una petición real. Así no matamos la sesión
		// de un usuario que está trabajando en otra pestaña.
		return;
	}

	try {
		const newToken = await triggerTokenRefresh();
		tokenManager.setAccessToken(newToken);
		scheduleNextRefresh(store, newToken);
	} catch (error) {
		if (process.env.NODE_ENV === 'development') {
			// eslint-disable-next-line no-console
			console.warn(
				`[TokenWorker] Refresh falló (intento ${retryCount + 1}/${MAX_RETRIES})`,
				error,
			);
		}

		// Retry con backoff si no hemos agotado los intentos
		if (retryCount < MAX_RETRIES - 1) {
			const delay = RETRY_DELAYS_MS[retryCount] ?? 10_000;
			clearScheduledRefresh();
			refreshTimeout = window.setTimeout(
				() => backgroundRefresh(store, retryCount + 1),
				delay,
			);
			return;
		}

		// Agotamos retries: NO hacemos logout.
		// Dejamos que el interceptor maneje el 401 si el usuario hace una petición.
		// Programamos un último intento en 30s por si fue un problema de red temporal.
		clearScheduledRefresh();
		refreshTimeout = window.setTimeout(() => backgroundRefresh(store, 0), 30_000);
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

	// --- VISIBILIDAD: Detectar cuando la pestaña vuelve a primer plano ---
	// Los navegadores congelan setTimeout en pestañas de fondo. Cuando el usuario
	// vuelve a esta pestaña, el timer pudo haberse retrasado y el token puede
	// estar expirado o en zona de peligro. Verificamos y actuamos inmediatamente.
	const handleVisibilityChange = () => {
		if (document.visibilityState !== 'visible') return;

		const state = store.getState();
		if (!state.auth.isAuthenticated) return;

		const token = tokenManager.getAccessToken() ?? state.auth.access;
		if (!token) return;

		// Si el token ya expiró o está en zona de peligro, refrescar inmediatamente
		if (!tokenManager.isTokenValid(token) || isInDangerZone(token)) {
			if (tokenManager.canRefresh(token)) {
				clearScheduledRefresh();
				backgroundRefresh(store, 0);
			}
			return;
		}

		// Si el token es válido y no está en peligro, reprogramar el refresh normal
		// por si el timer se congeló mientras estábamos en background
		scheduleNextRefresh(store, token);
	};

	document.addEventListener('visibilitychange', handleVisibilityChange);
};

export default initTokenRefreshWorker;
