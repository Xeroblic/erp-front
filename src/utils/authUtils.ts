export const forceLogout = (): void => {
	try {
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
		localStorage.removeItem('access_token_expires_at');
		localStorage.removeItem('refresh_token_expires_at');
		localStorage.removeItem('auth_last_activity');
	} catch {
		// ignore
	}

	if (typeof window !== 'undefined') {
		window.location.href = '/login';
	}
};

export default {
	forceLogout,
};
