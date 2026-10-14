/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	/** `'true'` en filiales con traslados y ajuste por bodega (etapa 2). */
	readonly VITE_INVENTORY_MULTI_LOCATION_ENABLED?: string;
	/** `'true'` para simular la trazabilidad agrupada (§14) en vez de usar la API. */
	readonly VITE_INVENTORY_OPERATIONS_USE_MOCKS?: string;
	// agrega más variables si es necesario
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
