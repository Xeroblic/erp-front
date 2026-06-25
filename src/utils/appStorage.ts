// src/utils/appStorage.ts
import { REMEMBERED_EMAIL_KEY } from '@/utils/rememberedAccount';

const APP_PREFIX = 'zentria_';

export function clearAppStorage(options?: { keepTheme?: boolean }) {
	if (typeof window === 'undefined') return;
	if (!window.localStorage) return;

	const { keepTheme = false } = options ?? {};
	const ls = window.localStorage;

	const keysToDelete: string[] = [];

	for (let i = 0; i < ls.length; i++) {
		const key = ls.key(i);
		if (!key) continue;

		// La cuenta recordada debe sobrevivir al logout: nunca se borra aquí.
		if (key === REMEMBERED_EMAIL_KEY) continue;

		const isAppKey = key.startsWith(APP_PREFIX) || key === 'theme';

		if (!isAppKey) continue;

		// si queremos mantener tema global
		if (keepTheme && (key === 'theme' || key.startsWith('zentria_theme'))) {
			continue;
		}

		keysToDelete.push(key);
	}

	keysToDelete.forEach((k) => ls.removeItem(k));
}
