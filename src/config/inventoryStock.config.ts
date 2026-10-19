/** ZF-111: no existe todavía un endpoint real al que recurrir. */
const INVENTORY_STOCK_USE_MOCKS = import.meta.env.VITE_INVENTORY_STOCK_USE_MOCKS === 'true';
export default INVENTORY_STOCK_USE_MOCKS;
