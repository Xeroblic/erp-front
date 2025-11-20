declare module '*.png';
declare module '*.webp';
declare module '*.md';
declare module '*.jpg';

// Declaración global para el store de Redux
declare global {
	interface Window {
		__REDUX_STORE__?: any;
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

declare module 'pdfmake/build/vfs_fonts' {
	export const vfs: Record<string, string>;
}
