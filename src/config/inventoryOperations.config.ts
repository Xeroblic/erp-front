/**
 * Trazabilidad agrupada (§14) con datos simulados. Bandera propia: el backend
 * ya publica `GET S/inventory-operations` y su detalle (tarea 17), mientras el
 * resumen de Inventario sigue simulado con `VITE_INVENTORY_STOCK_USE_MOCKS`.
 */
const INVENTORY_OPERATIONS_USE_MOCKS =
	import.meta.env.VITE_INVENTORY_OPERATIONS_USE_MOCKS === 'true';
export default INVENTORY_OPERATIONS_USE_MOCKS;
