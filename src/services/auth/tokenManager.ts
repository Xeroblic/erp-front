// src/services/auth/tokenManager.ts
let memoryAccessToken: string | null = null;
let lastActivityAt: number | null = null;

const REFRESH_TTL_MINUTES = Number(import.meta.env.VITE_JWT_REFRESH_TTL_MINUTES || '0');

export const tokenManager = {
	// --- GETTERS ---
	getAccessToken(): string | null {
		return memoryAccessToken;
	},

	// --- SETTERS ---
	setAccessToken(token: string | null) {
		memoryAccessToken = token;
		if (token) this.markActivity();
	},

	clearTokens() {
		memoryAccessToken = null;
		lastActivityAt = null;
	},

	// --- ACTIVITY TRACKING ---
	markActivity(timestamp: number = Date.now()) {
		lastActivityAt = timestamp;
	},

	isInactive(timeoutMs: number): boolean {
		if (!lastActivityAt) return false;
		return Date.now() - lastActivityAt >= timeoutMs;
	},

	// --- DECODING ---
	decodeJwtPayload(token: string | null): Record<string, any> | null {
		if (!token) return null;

		try {
			const parts = token.split('.');
			if (parts.length !== 3) return null;

			const payloadPart = parts[1]
				.replace(/-/g, '+')
				.replace(/_/g, '/')
				.padEnd(parts[1].length + ((4 - (parts[1].length % 4)) % 4), '=');

			const decoded = atob(payloadPart);
			return JSON.parse(decoded);
		} catch {
			return null;
		}
	},

	// --- EXPIRACIÓN NORMAL (exp) ---
	isTokenValid(token?: string | null): boolean {
		const payload = this.decodeJwtPayload(token || memoryAccessToken);
		const exp = typeof payload?.exp === 'number' ? payload.exp : null;
		if (!exp) return false;
		return Date.now() < exp * 1000;
	},

	getTokenTimeRemaining(token?: string | null): number {
		const payload = this.decodeJwtPayload(token || memoryAccessToken);
		const exp = typeof payload?.exp === 'number' ? payload.exp : null;
		if (!exp) return 0;
		return Math.max(0, exp * 1000 - Date.now());
	},

	// --- VENTANA DE REFRESH BASADA EN iat + refresh_ttl ---
	getRefreshExpiresAt(token?: string | null): number {
		const payload = this.decodeJwtPayload(token || memoryAccessToken);
		const iat = typeof payload?.iat === 'number' ? payload.iat : null;
		if (!iat || !REFRESH_TTL_MINUTES) return 0;
		return iat * 1000 + REFRESH_TTL_MINUTES * 60 * 1000;
	},

	canRefresh(token?: string | null): boolean {
		const refreshExpiresAt = this.getRefreshExpiresAt(token);
		if (!refreshExpiresAt) return false;
		return Date.now() < refreshExpiresAt;
	},
};

export default tokenManager;
