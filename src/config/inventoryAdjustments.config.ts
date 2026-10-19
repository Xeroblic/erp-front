/**
 * Ajuste de inventario con datos simulados. Bandera propia: el ajuste ya tiene
 * backend (tarea 10a) y en desarrollo usa el backend de desarrollo, mientras el
 * resto de Inventario sigue simulado con `VITE_INVENTORY_STOCK_USE_MOCKS`.
 */
const INVENTORY_ADJUSTMENTS_USE_MOCKS =
	import.meta.env.VITE_INVENTORY_ADJUSTMENTS_USE_MOCKS === 'true';
export default INVENTORY_ADJUSTMENTS_USE_MOCKS;
