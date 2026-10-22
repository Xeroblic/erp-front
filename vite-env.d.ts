/// <reference types="vite/client" />

/** Versión de `package.json`, inyectada por `define` en `vite.config.ts`. */
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	/** `'true'` para simular la trazabilidad agrupada (§14) en vez de usar la API. */
	readonly VITE_INVENTORY_OPERATIONS_USE_MOCKS?: string;
	/** `'true'` para simular las pantallas de Inventario en vez de leer `inventory-stock`. */
	readonly VITE_INVENTORY_OVERVIEW_USE_MOCKS?: string;
	// agrega más variables si es necesario
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
