// Datos mock para pruebas/desarrollo
import { WooCommerceConfig, WooCommerceLogEntry } from '../types/woocommerce.types';

export const mockWooConfig: WooCommerceConfig = {
    estado: false,
    url: '',
    consumerKey: '',
    consumerSecret: '',
    modo: 'lectura',
    ultimaSincronizacion: undefined,
};

export const mockWooLog: WooCommerceLogEntry[] = [
    { fecha: '2025-09-11 10:00', mensaje: 'Integración inicializada', tipo: 'info' },
    { fecha: '2025-09-11 10:05', mensaje: 'Error de credenciales', tipo: 'error' },
];
