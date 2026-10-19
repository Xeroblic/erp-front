/**
 * Rechazo local de las fachadas de abastecimiento e inventario cuando la rama
 * real se invoca antes de que el backend publique la ruta. Nunca reemplaza
 * una respuesta del servidor ni devuelve datos inventados.
 */

/** Código del rechazo local, no del contrato. */
export const PROCUREMENT_ENDPOINT_NOT_PUBLISHED = 'ENDPOINT_NOT_PUBLISHED';

/** Lleva `code` y `message` propios para que `getProcurementErrorMessage` muestre el motivo. */
export class ProcurementEndpointNotPublishedError extends Error {
	readonly code = PROCUREMENT_ENDPOINT_NOT_PUBLISHED;

	/**
	 * @param resource Qué falta, en la voz de la UI («las recepciones»).
	 * @param endpoint Ruta del contrato, pendiente de confirmar.
	 */
	constructor(
		resource: string,
		readonly endpoint: string,
	) {
		super(
			`El servidor todavía no publica ${resource} (${endpoint}). Esta pantalla sólo funciona con datos simulados.`,
		);
		this.name = 'ProcurementEndpointNotPublishedError';
	}
}

export const rejectEndpointNotPublished = (resource: string, endpoint: string): Promise<never> =>
	Promise.reject(new ProcurementEndpointNotPublishedError(resource, endpoint));

export const throwEndpointNotPublished = (resource: string, endpoint: string): never => {
	throw new ProcurementEndpointNotPublishedError(resource, endpoint);
};
