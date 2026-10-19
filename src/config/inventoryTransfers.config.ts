/**
 * Traslados internos con datos simulados. Bandera propia: el traslado ya tiene
 * backend (tarea 10b) y en desarrollo usa el backend de desarrollo, mientras el
 * resto de Inventario sigue simulado con `VITE_INVENTORY_STOCK_USE_MOCKS`.
 */
const INVENTORY_TRANSFERS_USE_MOCKS = import.meta.env.VITE_INVENTORY_TRANSFERS_USE_MOCKS === 'true';
export default INVENTORY_TRANSFERS_USE_MOCKS;
