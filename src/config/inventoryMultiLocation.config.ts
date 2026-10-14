/**
 * Etapa 2 del despliegue de inventario (multi-ubicación). En la etapa 1 todo el
 * stock vive en «Sin ubicación» y el backend responde
 * `409 MULTI_LOCATION_NOT_ENABLED` a todo traslado y a todo ajuste con bodega.
 * El backend no publica la etapa de la filial, así que la pantalla la toma de
 * esta bandera: apagada, oculta los traslados y fija el ajuste en «Sin
 * ubicación». El manejo del 409 queda como respaldo si no coincide.
 */
const INVENTORY_MULTI_LOCATION_ENABLED =
	import.meta.env.VITE_INVENTORY_MULTI_LOCATION_ENABLED === 'true';
export default INVENTORY_MULTI_LOCATION_ENABLED;
