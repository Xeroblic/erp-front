/**
 * Puente entre la capa HTTP y el store de Redux.
 *
 * `BaseService` necesita leer el token persistido y avisar al store cuando el token se
 * renueva o la sesión muere, pero no puede importar `@/store`: el store importa los slices,
 * los slices importan `ApiService` y `ApiService` importa `BaseService`, lo que cierra un
 * ciclo de imports en cada slice. El store registra este puente al crearse
 * (`storeSetup.ts`) y la capa HTTP sólo depende de esta interfaz.
 */
export interface IAuthStoreBridge {
	/** Token persistido en el store (respaldo cuando `tokenManager` aún no lo tiene en RAM). */
	getPersistedAccessToken: () => string | null | undefined;
	/** Propaga al store un token recién renovado. */
	onTokenRefreshed: (token: string) => void;
	/** Cierra la sesión en el store cuando la autenticación ya no se puede recuperar. */
	onSessionExpired: () => void;
}

let bridge: IAuthStoreBridge | null = null;

export const registerAuthStoreBridge = (next: IAuthStoreBridge) => {
	bridge = next;
};

export const getPersistedAccessToken = (): string | null =>
	bridge?.getPersistedAccessToken() ?? null;

export const notifyTokenRefreshed = (token: string) => {
	bridge?.onTokenRefreshed(token);
};

export const notifySessionExpired = () => {
	bridge?.onSessionExpired();
};
