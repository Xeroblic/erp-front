// src/utils/rememberedAccount.ts
// "Recordar cuenta": persiste SOLO el email (nunca la contraseña) para
// pre-rellenarlo en el próximo login. Debe sobrevivir al logout, por eso
// `clearAppStorage` preserva esta clave explícitamente.
export const REMEMBERED_EMAIL_KEY = 'zentria_remembered_email';

const hasStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

export const getRememberedEmail = (): string => {
	if (!hasStorage()) return '';
	return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
};

/** Guarda el email si viene con contenido; si llega vacío, olvida la cuenta. */
export const rememberEmail = (email: string): void => {
	if (!hasStorage()) return;
	const value = email.trim();
	if (value) {
		window.localStorage.setItem(REMEMBERED_EMAIL_KEY, value);
	} else {
		window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
	}
};

export const forgetRememberedEmail = (): void => {
	if (!hasStorage()) return;
	window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
};
