/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_DEFERRED_PAYMENTS_MOCK: string | undefined;
	// agrega más variables si es necesario
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
