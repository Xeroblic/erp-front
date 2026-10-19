/**
 * Recepciones de stock con datos simulados. Bandera propia: las recepciones ya
 * tienen backend (tareas 11 y 12) y en desarrollo usan el backend de
 * desarrollo, mientras el resto de Inventario sigue simulado con
 * `VITE_INVENTORY_STOCK_USE_MOCKS`.
 */
const INVENTORY_RECEIPTS_USE_MOCKS = import.meta.env.VITE_INVENTORY_RECEIPTS_USE_MOCKS === 'true';
export default INVENTORY_RECEIPTS_USE_MOCKS;
