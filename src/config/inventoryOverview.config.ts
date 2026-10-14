/**
 * Pantallas de Inventario (resumen, Por bodega, fichas de bodega y de
 * producto) con datos simulados. Bandera propia: leen `GET B/inventory-stock`
 * y `/{product}/origins`, ya publicadas, mientras el resto del módulo simulado
 * (documentación posterior, reportes) sigue con `VITE_INVENTORY_STOCK_USE_MOCKS`.
 */
const INVENTORY_OVERVIEW_USE_MOCKS = import.meta.env.VITE_INVENTORY_OVERVIEW_USE_MOCKS === 'true';
export default INVENTORY_OVERVIEW_USE_MOCKS;
