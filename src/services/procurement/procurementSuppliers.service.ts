import ApiService from '@/services/ApiService';
import { buildProcurementWriteHeaders } from '@/utils/procurementWrite.util';
import type {
	IApiCollectionEnvelope,
	IApiResourceEnvelope,
	IProcurementSupplier,
	IProcurementSupplierListParams,
	IProcurementSupplierListRow,
	IProcurementSupplierPayload,
} from '@/interface/procurement.interface';

/**
 * Maestro de proveedores de abastecimiento — sección 5 del contrato,
 * `/api/subsidiaries/{subsidiary}/procurement/suppliers` (backend PR #93).
 *
 * Contrato verificado contra el backend:
 * - Permisos por ruta: `view-`, `create-`, `edit-`, `delete-` y
 *   `restore-procurement-supplier`, además del acceso a la filial.
 * - Toda escritura exige `Idempotency-Key` UUID: sin ella el backend
 *   responde 4xx antes de ejecutar, por eso aquí la clave es obligatoria.
 * - `DELETE` responde 204 sin cuerpo; `restore`, la ficha completa.
 * - Los 409 de estado (ya activo/inactivo, editar uno inactivo) no traen
 *   `code`: la UI los evita con `allowed_actions` y sólo muestra `message`.
 * - `is_active` e `include_inactive` son excluyentes (422 si van juntos);
 *   `per_page` admite hasta 100.
 *
 * Sin caché de `ApiService`: la ficha cambia con cada escritura y el slice ya
 * descarta respuestas tardías por `requestId`.
 */

interface IProcurementSupplierWriteHeaders {
	idempotencyKey: string;
}

const suppliersUrl = (subsidiaryId: number): string =>
	`/subsidiaries/${subsidiaryId}/procurement/suppliers`;

const supplierUrl = (subsidiaryId: number, id: number): string =>
	`${suppliersUrl(subsidiaryId)}/${id}`;

/** `GET /suppliers`: filas resumidas, sin `purchase_summary`. Activos por defecto. */
export const listProcurementSuppliers = async (
	subsidiaryId: number,
	params: IProcurementSupplierListParams = {},
): Promise<IApiCollectionEnvelope<IProcurementSupplierListRow>> => {
	const response = await ApiService.fetchData<
		IApiCollectionEnvelope<IProcurementSupplierListRow>
	>({
		url: suppliersUrl(subsidiaryId),
		method: 'get',
		params,
	});
	return response.data;
};

/** `GET /suppliers/{supplier}`: ficha completa, también de un proveedor desactivado. */
export const getProcurementSupplier = async (
	subsidiaryId: number,
	id: number,
): Promise<IApiResourceEnvelope<IProcurementSupplier>> => {
	const response = await ApiService.fetchData<IApiResourceEnvelope<IProcurementSupplier>>({
		url: supplierUrl(subsidiaryId, id),
		method: 'get',
	});
	return response.data;
};

/** `POST /suppliers`: 201 con la ficha, 409 `SUPPLIER_RUT_ALREADY_EXISTS` o 422. */
export const createProcurementSupplier = async (
	subsidiaryId: number,
	payload: IProcurementSupplierPayload,
	headers: IProcurementSupplierWriteHeaders,
): Promise<IApiResourceEnvelope<IProcurementSupplier>> => {
	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IProcurementSupplier>,
		IProcurementSupplierPayload
	>({
		url: suppliersUrl(subsidiaryId),
		method: 'post',
		data: payload,
		headers: buildProcurementWriteHeaders(headers),
	});
	return response.data;
};

/** `PATCH /suppliers/{supplier}`: 200 con la ficha, o 404/409/422. */
export const updateProcurementSupplier = async (
	subsidiaryId: number,
	id: number,
	payload: IProcurementSupplierPayload,
	headers: IProcurementSupplierWriteHeaders,
): Promise<IApiResourceEnvelope<IProcurementSupplier>> => {
	const response = await ApiService.fetchData<
		IApiResourceEnvelope<IProcurementSupplier>,
		IProcurementSupplierPayload
	>({
		url: supplierUrl(subsidiaryId, id),
		method: 'patch',
		data: payload,
		headers: buildProcurementWriteHeaders(headers),
	});
	return response.data;
};

/** `DELETE /suppliers/{supplier}`: soft delete, 204 sin cuerpo. */
export const deactivateProcurementSupplier = async (
	subsidiaryId: number,
	id: number,
	headers: IProcurementSupplierWriteHeaders,
): Promise<void> => {
	await ApiService.fetchData({
		url: supplierUrl(subsidiaryId, id),
		method: 'delete',
		headers: buildProcurementWriteHeaders(headers),
	});
};

/** `POST /suppliers/{supplier}/restore`: 200 con la ficha completa. */
export const restoreProcurementSupplier = async (
	subsidiaryId: number,
	id: number,
	headers: IProcurementSupplierWriteHeaders,
): Promise<IApiResourceEnvelope<IProcurementSupplier>> => {
	const response = await ApiService.fetchData<IApiResourceEnvelope<IProcurementSupplier>>({
		url: `${supplierUrl(subsidiaryId, id)}/restore`,
		method: 'post',
		headers: buildProcurementWriteHeaders(headers),
	});
	return response.data;
};
