import * as Yup from 'yup';
import type { ISaleFulfillmentOptionItem } from '@/interface/sales.interface';

/**
 * Clave de la ubicación en el formulario: un `<select>` sólo maneja strings, y `null`
 * («Sin ubicación») necesita una propia. `''` es «todavía sin elegir».
 */
export const UNLOCATED_KEY = 'none';

export interface ILocationAllocationRow {
	warehouseKey: string;
	quantity: number | '';
}

export interface ILocationAllocationItemValues {
	rows: ILocationAllocationRow[];
}

/**
 * Elección de ubicaciones del cierre, sólo para los ítems `manual`. Las claves llevan
 * prefijo (`item_201`): Formik convierte una clave numérica en índice de arreglo.
 */
export interface ILocationAllocationValues {
	items: Record<string, ILocationAllocationItemValues>;
}

export const toItemKey = (saleItemId: number): string => `item_${saleItemId}`;

export const toWarehouseKey = (warehouseId: number | null): string =>
	warehouseId === null ? UNLOCATED_KEY : String(warehouseId);

export const fromWarehouseKey = (key: string): number | null =>
	key === UNLOCATED_KEY ? null : Number(key);

/** Suma lo asignado en las filas con cantidad numérica. */
export const sumAllocatedRows = (rows: readonly Partial<ILocationAllocationRow>[]): number =>
	rows.reduce((sum, row) => sum + (typeof row.quantity === 'number' ? row.quantity : 0), 0);

const fitUnits = (count: number): string =>
	count === 1 ? '1 unidad apta' : `${count} unidades aptas`;

/**
 * Esquema de la elección de un ítem `manual`. Lo que valida el backend en el cierre
 * se adelanta aquí: cada ubicación es una de las ofrecidas, sin repetir, con cantidad
 * entera ≥ 1 que no supere su apto, y la suma da la cantidad del ítem. Los errores
 * del ítem completo van a `items.<clave>.summary`, fuera de las filas.
 */
const buildItemSchema = (option: ISaleFulfillmentOptionItem) => {
	const locationsByKey = new Map(
		option.locations.map((location) => [toWarehouseKey(location.warehouse_id), location]),
	);

	return Yup.object({
		rows: Yup.array()
			.of(
				Yup.object({
					warehouseKey: Yup.string()
						.required('Elige una ubicación.')
						.test(
							'offered',
							'Esa ubicación ya no tiene stock apto.',
							(value) => !value || locationsByKey.has(value),
						),
					quantity: Yup.number()
						.typeError('Indica la cantidad.')
						.required('Indica la cantidad.')
						.integer('Usa un número entero.')
						.min(1, 'Debe ser al menos 1.')
						.test('fit', function fitsLocation(value) {
							const parent = this.parent as ILocationAllocationRow;
							const location = locationsByKey.get(parent.warehouseKey);
							if (
								value === undefined ||
								!location ||
								value <= location.fit_quantity
							) {
								return true;
							}
							return this.createError({
								message: `«${location.name}» tiene ${fitUnits(location.fit_quantity)}.`,
							});
						}),
				}),
			)
			.min(1, 'Agrega al menos una ubicación.'),
	})
		.test('distinct', function distinctLocations(value) {
			const keys = (value?.rows ?? [])
				.map((row) => row.warehouseKey)
				.filter((key): key is string => Boolean(key));
			if (new Set(keys).size === keys.length) return true;
			return this.createError({
				path: `${this.path}.summary`,
				message: 'No repitas una ubicación en el mismo ítem.',
			});
		})
		.test('total', function matchesRequired(value) {
			const allocated = sumAllocatedRows(value?.rows ?? []);
			if (allocated === option.quantity_required) return true;
			return this.createError({
				path: `${this.path}.summary`,
				message: `Las ubicaciones suman ${allocated} y el ítem pide ${option.quantity_required}.`,
			});
		});
};

/** Sólo los ítems `manual` llevan elección; `automatic` y `blocked` no tienen campos. */
export const buildLocationAllocationSchema = (options: ISaleFulfillmentOptionItem[]) =>
	Yup.object({
		items: Yup.object(
			Object.fromEntries(
				options
					.filter((option) => option.allocation_mode === 'manual')
					.map((option) => [toItemKey(option.sale_item_id), buildItemSchema(option)]),
			),
		),
	});
