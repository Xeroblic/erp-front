const RELOAD_MARK_KEY = 'zentria:chunk-reload-at';
// Si el chunk sigue faltando tras recargar, se deja de insistir para no entrar en un bucle.
const RELOAD_GUARD_MS = 30_000;

// Mensajes de Chromium, Firefox y Safari al fallar un import dinámico, y el de Vite con el CSS.
const CHUNK_ERROR_PATTERN =
	/failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|unable to preload css/i;

export const isChunkLoadError = (error: unknown): boolean =>
	error instanceof Error && CHUNK_ERROR_PATTERN.test(error.message);

export const canAutoReload = (): boolean => {
	// Sin conexión, recargar cambiaría la pantalla de error por la del navegador.
	if (!navigator.onLine) return false;
	try {
		const lastReloadAt = Number(window.sessionStorage.getItem(RELOAD_MARK_KEY));
		return Date.now() - lastReloadAt > RELOAD_GUARD_MS;
	} catch {
		return false;
	}
};

/** Devuelve `false` si no se pudo dejar la marca: sin ella, recargar podría no terminar nunca. */
export const markAutoReload = (): boolean => {
	try {
		window.sessionStorage.setItem(RELOAD_MARK_KEY, String(Date.now()));
		return true;
	} catch {
		return false;
	}
};
