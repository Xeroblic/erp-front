// Tipos e interfaces para integración WooCommerce
export type WooCommerceMode = 'lectura' | 'lectura-escritura';
export interface WooCommerceConfig {
    estado: boolean;
    url: string;
    consumerKey: string;
    consumerSecret: string;
    modo: WooCommerceMode;
    ultimaSincronizacion?: string;
}
export interface WooCommerceLogEntry {
    fecha: string;
    mensaje: string;
    tipo: 'error' | 'info' | 'sync';
}
