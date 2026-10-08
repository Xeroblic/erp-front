/**
 * Acceso a `sessionStorage` que nunca lanza: en modo privado estricto, con la
 * cuota agotada o con el almacenamiento bloqueado por política, leer o escribir
 * lanza y tumbaría el montaje de la pantalla. Lo guardado ahí es siempre una
 * preferencia o un recordatorio prescindible, así que se degrada a «no hay
 * dato» en vez de romper.
 */
export const readSessionItem = (key: string): string | null => {
	try {
		return window.sessionStorage.getItem(key);
	} catch {
		return null;
	}
};

export const writeSessionItem = (key: string, value: string): void => {
	try {
		window.sessionStorage.setItem(key, value);
	} catch {
		// Sin almacenamiento sólo se pierde la preferencia.
	}
};

export const removeSessionItem = (key: string): void => {
	try {
		window.sessionStorage.removeItem(key);
	} catch {
		// Sin almacenamiento no hay nada que borrar.
	}
};
