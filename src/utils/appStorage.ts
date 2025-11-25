// src/utils/appStorage.ts
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

    const isAppKey =
      key.startsWith(APP_PREFIX) ||
      key === 'theme';

    if (!isAppKey) continue;

    // si queremos mantener tema global
    if (
      keepTheme &&
      (key === 'theme' || key.startsWith('zentria_theme'))
    ) {
      continue;
    }

    keysToDelete.push(key);
  }

  keysToDelete.forEach((k) => ls.removeItem(k));
}
