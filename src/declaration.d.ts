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
