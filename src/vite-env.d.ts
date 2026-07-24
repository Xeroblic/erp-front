/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_DEFERRED_PAYMENTS_MOCK?: 'true' | 'false';
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
