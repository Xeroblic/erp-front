const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const ACCESS_EXP_KEY = 'access_token_expires_at';
const REFRESH_EXP_KEY = 'refresh_token_expires_at';
const LAST_ACTIVITY_KEY = 'auth_last_activity';

export const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 15_000; // 15 seconds
export const DEFAULT_INACTIVITY_TIMEOUT_MS = 30 * 60_000; // 30 minutes

type StoredTimestamps = {
	accessExpiresAt?: number | null;
	refreshExpiresAt?: number | null;
	lastActivityAt?: number | null;
};

const parseStorageNumber = (value: string | null | undefined): number | null => {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};

const decodeJwtPayload = (token?: string | null): Record<string, unknown> | null => {
	if (!token) return null;
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const [, payload] = parts;
		if (!payload) return null;

		// Añadir padding si es necesario
		const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
		const decoded = atob(padded);
		return JSON.parse(decoded);
	} catch (err) {
		console.warn('Error decoding JWT token:', err);
		return null;
	}
};

const computeExpiresAt = (token?: string | null): number | null => {
	const payload = decodeJwtPayload(token);
	const exp = typeof payload?.exp === 'number' ? payload.exp : null;
	return exp ? exp * 1000 : null;
};

export const tokenManager = {
	getAccessToken(): string | undefined {
		return localStorage.getItem(ACCESS_KEY) || undefined;
	},

	getRefreshToken(): string | undefined {
		return localStorage.getItem(REFRESH_KEY) || undefined;
	},

	getTimestamps(): StoredTimestamps {
		return {
			accessExpiresAt: parseStorageNumber(localStorage.getItem(ACCESS_EXP_KEY)),
			refreshExpiresAt: parseStorageNumber(localStorage.getItem(REFRESH_EXP_KEY)),
			lastActivityAt: parseStorageNumber(localStorage.getItem(LAST_ACTIVITY_KEY)),
		};
	},

	persistTokens(params: {
		accessToken: string;
		refreshToken?: string;
		accessExpiresAt?: number | null;
		refreshExpiresAt?: number | null;
	}) {
		const { accessToken, refreshToken } = params;
		const resolvedAccessExpiresAt =
			typeof params.accessExpiresAt === 'number'
				? params.accessExpiresAt
				: computeExpiresAt(accessToken);
		const resolvedRefreshExpiresAt =
			typeof params.refreshExpiresAt === 'number'
				? params.refreshExpiresAt
				: computeExpiresAt(refreshToken);

		localStorage.setItem(ACCESS_KEY, accessToken);

		if (typeof resolvedAccessExpiresAt === 'number') {
			localStorage.setItem(ACCESS_EXP_KEY, String(resolvedAccessExpiresAt));
		} else {
			localStorage.removeItem(ACCESS_EXP_KEY);
		}

		if (refreshToken) {
			localStorage.setItem(REFRESH_KEY, refreshToken);
		} else {
			localStorage.removeItem(REFRESH_KEY);
		}

		if (typeof resolvedRefreshExpiresAt === 'number') {
			localStorage.setItem(REFRESH_EXP_KEY, String(resolvedRefreshExpiresAt));
		} else {
			localStorage.removeItem(REFRESH_EXP_KEY);
		}

		return {
			accessExpiresAt: resolvedAccessExpiresAt ?? null,
			refreshExpiresAt: resolvedRefreshExpiresAt ?? null,
		};
	},

	clearTokens() {
		localStorage.removeItem(ACCESS_KEY);
		localStorage.removeItem(REFRESH_KEY);
		localStorage.removeItem(ACCESS_EXP_KEY);
		localStorage.removeItem(REFRESH_EXP_KEY);
		localStorage.removeItem(LAST_ACTIVITY_KEY);
	},

	markActivity(timestamp: number = Date.now()) {
		localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
	},

	isAccessTokenExpiring(leewayMs: number = ACCESS_TOKEN_REFRESH_LEEWAY_MS): boolean {
		const { accessExpiresAt } = this.getTimestamps();
		if (!accessExpiresAt) return false;
		return accessExpiresAt - Date.now() <= leewayMs;
	},

	isRefreshTokenExpired(): boolean {
		const { refreshExpiresAt } = this.getTimestamps();
		if (!refreshExpiresAt) return false;
		return Date.now() >= refreshExpiresAt;
	},

	isInactive(timeoutMs: number = DEFAULT_INACTIVITY_TIMEOUT_MS): boolean {
		const { lastActivityAt } = this.getTimestamps();
		if (!lastActivityAt) return false;
		return Date.now() - lastActivityAt >= timeoutMs;
	},

	
	isTokenValid(token?: string | null): boolean {
		if (!token) return false;
		const payload = decodeJwtPayload(token);
		if (!payload) return false;

		const exp = typeof payload.exp === 'number' ? payload.exp : null;
		if (!exp) return false;

		return Date.now() < exp * 1000;
	},

	getTokenTimeRemaining(token?: string | null): number {
		if (!token) return 0;
		const payload = decodeJwtPayload(token);
		if (!payload) return 0;

		const exp = typeof payload.exp === 'number' ? payload.exp : null;
		if (!exp) return 0;

		const remaining = exp * 1000 - Date.now();
		return Math.max(0, remaining);
	},
};

export default tokenManager;
