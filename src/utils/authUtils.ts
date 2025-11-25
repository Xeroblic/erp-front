// src/utils/authUtils.ts
import tokenManager from '@/services/auth/tokenManager';
import { clearAppStorage } from './appStorage';

export const forceLogout = (): void => {
  try {
    // Limpia tokens en memoria
    tokenManager.clearTokens();

    // Limpia storage de la app, manteniendo tema si quieres
    clearAppStorage({ keepTheme: true });
  } catch (e) {
    console.error('Error cleaning storage on forceLogout', e);
  }

  if (typeof window !== 'undefined') {
    window.location.href = '/login';
    // o window.location.replace('/login');
  }
};

export default { forceLogout };


// Legacy code kept for reference

// export const forceLogout = (): void => {
// 	try {
// 		localStorage.removeItem('access_token');
// 		localStorage.removeItem('refresh_token');
// 		localStorage.removeItem('access_token_expires_at');
// 		localStorage.removeItem('refresh_token_expires_at');
// 		localStorage.removeItem('auth_last_activity');
// 	} catch {
// 		// ignore
// 	}

// 	if (typeof window !== 'undefined') {
// 		window.location.href = '/login';
// 	}
// };

// export default {
// 	forceLogout,
// };
