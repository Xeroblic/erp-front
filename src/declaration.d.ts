declare module '*.png';
declare module '*.webp';
declare module '*.md';
declare module '*.jpg';

// Assets importados como URL (Vite `?url`)
declare module '*.xlsx?url' {
	const src: string;
	export default src;
}

// Declaración global para el store de Redux
declare global {
	interface Window {
		__REDUX_STORE__?: unknown;
		lastDarkModeLog?: string; // Para controlar logs de dark mode
	}
}

declare module 'pdfmake/interfaces' {
	export interface StyleDictionary {
		[key: string]: unknown;
	}

	export interface TDocumentDefinitions {
		content?: unknown;
		styles?: StyleDictionary;
		defaultStyle?: Record<string, unknown>;
		pageSize?: string | { width: number; height: number };
		pageMargins?: number[] | undefined;
		[key: string]: unknown;
	}
}

// Build del navegador sin tipos: `loadPdfMake` valida su forma antes de usarlo.
declare module 'pdfmake/build/pdfmake' {
	const pdfMake: unknown;
	export default pdfMake;
}

// CJS: `module.exports` es el mapa archivo → contenido en base64.
declare module 'pdfmake/build/vfs_fonts' {
	const vfs: Record<string, string>;
	export default vfs;
}
