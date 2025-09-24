import { WooSyncJob } from '../types/wooSync.types';

export const MOCK_SYNC_HISTORY: WooSyncJob[] = [
    	{
		id: 1001,
		type: 'pull',
		status: 'completed',
		started_at: '2025-09-10T08:00:00Z',
		completed_at: '2025-09-10T08:05:00Z',
		products_processed: 15,
		products_updated: 15,
		products_failed: 0,
		log: ['Importación exitosa', 'Todos los productos actualizados'],
	},
	{
		id: 1002,
		type: 'push',
		status: 'completed',
		started_at: '2025-09-09T16:30:00Z',
		completed_at: '2025-09-09T16:33:00Z',
		products_processed: 8,
		products_updated: 7,
		products_failed: 1,
		errors: ['SKU-404: Producto no encontrado'],
	},
	{
		id: 1003,
		type: 'pull',
		status: 'failed',
		started_at: '2025-09-08T14:15:00Z',
		completed_at: '2025-09-08T14:16:00Z',
		products_processed: 0,
		products_updated: 0,
		products_failed: 0,
		errors: ['Error de conexión con WooCommerce API'],
	},
];