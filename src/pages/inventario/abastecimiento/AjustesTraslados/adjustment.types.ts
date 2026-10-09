import * as Yup from 'yup';
import { LOCATION_TOKEN_PATTERN } from '@/utils/inventoryLocation.util';
import type { TStockCondition } from '@/interface/procurement.interface';

export interface IAjusteItemDraft {
	productId: number | '';
	/** Delta firmado: negativo es egreso, positivo es ingreso. Nunca cero. */
	quantityDelta: string;
	condition: TStockCondition;
}

/**
 * El ajuste corrige el saldo de **una ubicación**: la elegida en el primer paso.
 * No se enlaza a una recepción ni se elige de qué compra descontar; un egreso
 * consume lo más antiguo primero (FIFO) y un ingreso entra como origen de
 * ajuste. Las diferencias de una recepción se corrigen en la recepción.
 */
export interface IAjusteFormValues {
	location: string;
	reason: string;
	notes: string;
	items: IAjusteItemDraft[];
}

/** Límites de `POST B/inventory-adjustments` (`StoreInventoryAdjustmentRequest`). */
export const AJUSTE_REASON_MAX = 500;
export const AJUSTE_NOTES_MAX = 2000;
export const AJUSTE_ITEMS_MAX = 100;
export const AJUSTE_DELTA_MAX = 1_000_000;

export const emptyAjusteItem = (): IAjusteItemDraft => ({
	productId: '',
	quantityDelta: '',
	condition: 'fit',
});

export const AjusteSchema = Yup.object({
	location: Yup.string()
		.matches(LOCATION_TOKEN_PATTERN, 'Selecciona una ubicación válida.')
		// `warehouse_id` es obligatorio aunque admita `null`: «Sin ubicación» es
		// una respuesta, no la ausencia de respuesta.
		.required('Indica la ubicación del ajuste.'),
	reason: Yup.string()
		.trim()
		.max(AJUSTE_REASON_MAX, `El motivo no puede superar los ${AJUSTE_REASON_MAX} caracteres.`)
		.required('Indica el motivo del ajuste.'),
	// Sin `.defined()` en los opcionales: Formik convierte cadena vacía en
	// `undefined` antes de validar (`prepareDataForValidation`), así que un
	// `.defined()` acá rechazaría el formulario recién abierto, con el campo
	// simplemente en blanco.
	notes: Yup.string().max(
		AJUSTE_NOTES_MAX,
		`Las notas no pueden superar los ${AJUSTE_NOTES_MAX} caracteres.`,
	),
	items: Yup.array()
		.of(
			Yup.object({
				productId: Yup.number()
					.typeError('Selecciona un producto.')
					.integer()
					.positive()
					.required('Selecciona un producto.'),
				quantityDelta: Yup.number()
					.typeError(
						'Ingresa una cantidad entera: positiva para ingreso, negativa para egreso.',
					)
					.integer(
						'Ingresa una cantidad entera: positiva para ingreso, negativa para egreso.',
					)
					.notOneOf([0], 'La cantidad de ajuste no puede ser cero.')
					.min(-AJUSTE_DELTA_MAX, 'El ajuste no puede superar 1.000.000 unidades.')
					.max(AJUSTE_DELTA_MAX, 'El ajuste no puede superar 1.000.000 unidades.')
					.required('Indica la cantidad de ajuste.'),
				condition: Yup.string()
					.oneOf(['fit', 'unfit'], 'Indica si las unidades son aptas o no aptas.')
					.required('Indica si las unidades son aptas o no aptas.'),
			}).defined(),
		)
		.min(1, 'Agrega al menos un producto al ajuste.')
		.max(AJUSTE_ITEMS_MAX, `Un ajuste admite hasta ${AJUSTE_ITEMS_MAX} líneas.`)
		.test(
			'sin-duplicados',
			'Hay dos líneas del mismo producto y condición: déjalas en una con la diferencia neta.',
			(items) => {
				const keys = (items ?? [])
					.filter((item) => Number.isFinite(item.productId))
					.map((item) => `${String(item.productId)}:${String(item.condition)}`);
				return new Set(keys).size === keys.length;
			},
		)
		.defined(),
});

/** Campos de un 422 que tienen equivalente directo en el formulario. */
export const AJUSTE_FORM_FIELDS: Readonly<Record<string, string>> = {
	reason: 'reason',
	notes: 'notes',
	warehouse_id: 'location',
};

/** Errores del servidor por línea: índice del formulario → campo → mensaje. */
export type TAjusteLineErrors = Record<number, Partial<Record<keyof IAjusteItemDraft, string>>>;

const ITEM_FIELD_PATTERN = /^items\.(\d+)\.(\w+)$/;

/**
 * Campo del formulario que muestra cada error de línea. `origin_id` no tiene
 * campo propio (el ajuste consume FIFO): se marca en el producto, igual que
 * cualquier campo que el formulario no conozca.
 */
const ITEM_FORM_FIELDS: Readonly<Record<string, keyof IAjusteItemDraft>> = {
	product_id: 'productId',
	quantity_delta: 'quantityDelta',
	condition: 'condition',
};

/**
 * Errores de línea de un 422 (`items.N.campo`) por línea del formulario: el
 * backend no reordena, así que `N` es la posición enviada. Se queda con el
 * primer mensaje de cada campo.
 */
export const ajusteLineErrorsFrom = (
	fieldErrors: Record<string, string[]> | null,
): TAjusteLineErrors => {
	const lines: TAjusteLineErrors = {};
	Object.entries(fieldErrors ?? {}).forEach(([apiField, messages]) => {
		const match = ITEM_FIELD_PATTERN.exec(apiField);
		if (!match || !messages[0]) return;
		const index = Number(match[1]);
		const field = ITEM_FORM_FIELDS[match[2]] ?? 'productId';
		const line = lines[index] ?? {};
		line[field] ??= messages[0];
		lines[index] = line;
	});
	return lines;
};

/**
 * Unidades sin procedencia que un `409 INSUFFICIENT_LOCATION_STOCK` informa en
 * `context`. Un respaldo automático las regulariza cada 15 minutos, así que
 * el mismo ajuste puede pasar más tarde (con una clave nueva).
 */
export const unattributedFromContext = (context: Record<string, unknown> | null): number => {
	const value = context?.unattributed_quantity;
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};
