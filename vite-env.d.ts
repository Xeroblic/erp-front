/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	/** `'true'` en filiales con traslados y ajuste por bodega (etapa 2). */
	readonly VITE_INVENTORY_MULTI_LOCATION_ENABLED?: string;
	// agrega más variables si es necesario
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
