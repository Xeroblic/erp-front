import { WooSyncJob } from "../types/wooSync.types";

export const mockWooSyncApi = {
  
  async pullStock(): Promise<WooSyncJob> {
    await new Promise(r => setTimeout(r, 2000));
    const id = Date.now();
    return {
      id, type: 'pull', status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      products_processed: 15, products_updated: 12, products_failed: 1,
      errors: ['SKU-404: Producto no encontrado en WooCommerce'],
      log: [
        `[${new Date().toLocaleTimeString()}] Iniciando importación de stock desde WooCommerce`,
        `[${new Date().toLocaleTimeString()}] Conectando a WooCommerce API...`,
        `[${new Date().toLocaleTimeString()}] Procesando 15 productos`,
        `[${new Date().toLocaleTimeString()}] Importación completada`,
      ],
    };
  },

async pushStock(selectedIds: number[]): Promise<WooSyncJob> {
    await new Promise(r => setTimeout(r, 3000));
    const id = Date.now();
    return {
      id, type: 'push', status: 'completed',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      products_processed: selectedIds.length,
      products_updated: Math.max(0, selectedIds.length - 1),
      products_failed: selectedIds.length ? 1 : 0,
      errors: ['LAP-DELL-15: Error de conexión al actualizar en WooCommerce'],
      log: [
        `[${new Date().toLocaleTimeString()}] Iniciando actualización de stock en WooCommerce`,
        `[${new Date().toLocaleTimeString()}] Productos seleccionados: ${selectedIds.length}`,
        `[${new Date().toLocaleTimeString()}] Actualización completada`,
      ],
    };
  },
  
};