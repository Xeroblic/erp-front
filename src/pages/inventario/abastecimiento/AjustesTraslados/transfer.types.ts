import * as Yup from 'yup';
import { LOCATION_TOKEN_PATTERN } from '@/utils/inventoryLocation.util';
import {
	itemLineErrorsFrom,
	type TItemLineErrors,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/types';
import type { TStockCondition } from '@/interface/procurement.interface';

export interface ITrasladoItemDraft {
	productId: number | '';
	quantity: string;
	condition: TStockCondition;
}

export interface ITrasladoFormValues {
	from: string;
	to: string;
	reason: string;
	items: ITrasladoItemDraft[];
}

/** Límites de `POST B/warehouse-stock-movements` (`StoreWarehouseStockMovementRequest`). */
export const TRASLADO_REASON_MAX = 500;
export const TRASLADO_ITEMS_MAX = 100;
export const TRASLADO_QUANTITY_MAX = 1_000_000;

export const emptyTrasladoItem = (): ITrasladoItemDraft => ({
	productId: '',
	quantity: '',
	condition: 'fit',
});

export const TrasladoSchema = Yup.object({
	from: Yup.string()
		.matches(LOCATION_TOKEN_PATTERN, 'Selecciona una ubicación de origen válida.')
		.required('Selecciona una ubicación de origen.'),
	to: Yup.string()
		.matches(LOCATION_TOKEN_PATTERN, 'Selecciona una ubicación de destino válida.')
		.required('Selecciona una ubicación de destino.')
		// El backend también lo rechaza, «Sin ubicación» contra sí misma incluida
		// (422 en `to_warehouse_id`); acá se atrapa antes para no gastar una
		// escritura en un error evitable.
		.notOneOf([Yup.ref('from')], 'El destino debe ser distinto del origen.'),
	reason: Yup.string()
		.trim()
		.max(
			TRASLADO_REASON_MAX,
			`El motivo no puede superar los ${TRASLADO_REASON_MAX} caracteres.`,
		)
		.required('Indica el motivo del traslado.'),
	items: Yup.array()
		.of(
			Yup.object({
				productId: Yup.number()
					.typeError('Selecciona un producto.')
					.integer()
					.positive()
					.required('Selecciona un producto.'),
				quantity: Yup.number()
					.typeError('La cantidad debe ser un entero positivo.')
					.integer('La cantidad debe ser un entero positivo.')
					.positive('La cantidad debe ser un entero positivo.')
					.max(
						TRASLADO_QUANTITY_MAX,
						'Un traslado no puede superar 1.000.000 unidades por línea.',
					)
					.required('Indica la cantidad.'),
				condition: Yup.string()
					.oneOf(['fit', 'unfit'], 'Indica si las unidades son aptas o no aptas.')
					.required('Indica si las unidades son aptas o no aptas.'),
			}).defined(),
		)
		.min(1, 'Agrega al menos un producto al traslado.')
		.max(TRASLADO_ITEMS_MAX, `Un traslado admite hasta ${TRASLADO_ITEMS_MAX} líneas.`)
		// Dos líneas del mismo par producto/condición serían una sola cantidad
		// escrita dos veces: el backend responde 422 en `items.N.product_id`.
		.test('sin-duplicados', 'Hay dos líneas del mismo producto y condición.', (items) => {
			// Una línea sin producto todavía no puede duplicar a nadie: Yup
			// convierte el vacío en NaN al castear, y así queda fuera del conteo.
			const keys = (items ?? [])
				.filter((item) => Number.isFinite(item.productId))
				.map((item) => `${String(item.productId)}:${String(item.condition)}`);
			return new Set(keys).size === keys.length;
		})
		.defined(),
});

/**
 * Campos de un 422 que tienen equivalente directo en el formulario. Origen y
 * destino iguales llega siempre en `to_warehouse_id`, igual que un destino
 * inactivo o ajeno a la sucursal.
 */
export const TRASLADO_FORM_FIELDS: Readonly<Record<string, string>> = {
	reason: 'reason',
	from_warehouse_id: 'from',
	to_warehouse_id: 'to',
};

const ITEM_FORM_FIELDS: Readonly<Record<string, keyof ITrasladoItemDraft>> = {
	product_id: 'productId',
	quantity: 'quantity',
	condition: 'condition',
};

/** Errores de línea de un 422 (`items.N.campo`) por línea del formulario de traslado. */
export const trasladoLineErrorsFrom = (
	fieldErrors: Record<string, string[]> | null,
): TItemLineErrors<keyof ITrasladoItemDraft> =>
	itemLineErrorsFrom(fieldErrors, ITEM_FORM_FIELDS, 'productId');
