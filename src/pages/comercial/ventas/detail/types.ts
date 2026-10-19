import * as Yup from 'yup';
import type {
	ISaleFulfillmentOptionItem,
	ISaleReturnItem,
	TSaleReturnCondition,
} from '@/interface/sales.interface';

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

// ---------------------------------------------------------------------------
// Devoluciones físicas (etapa 2)
// ---------------------------------------------------------------------------

export const RETURN_REASON_MAX = 500;

export interface IStartSaleReturnValues {
	reason: string;
}

export const StartSaleReturnSchema = Yup.object({
	reason: Yup.string()
		.trim()
		.required('Indica el motivo de la devolución.')
		.max(RETURN_REASON_MAX, `Usa como máximo ${RETURN_REASON_MAX} caracteres.`),
});

/** Parte de un ítem sin serie: ubicación, cantidad y condición. */
export interface IReturnAllocationRow {
	warehouseKey: string;
	quantity: number | '';
	condition: TSaleReturnCondition;
	reason: string;
}

/**
 * Una serie devuelta. Su `warehouseKey` usa la misma clave que «Sin ubicación»
 * (`UNLOCATED_KEY`) para `null`, que en una serie significa «conserva su bodega».
 */
export interface IReturnSerialRow {
	serialNumber: string;
	warehouseKey: string;
	condition: TSaleReturnCondition;
	reason: string;
}

/** Un ítem sin serie usa `rows`; uno con serie, `serials`. El otro queda vacío. */
export interface IReturnReceiptItemValues {
	rows: IReturnAllocationRow[];
	serials: IReturnSerialRow[];
}

/** Recepción de la devolución, con las claves de ítem de `toItemKey`. */
export interface IReturnReceiptValues {
	items: Record<string, IReturnReceiptItemValues>;
}

const returnReasonSchema = Yup.string().when('condition', {
	is: 'unfit',
	then: (schema) =>
		schema
			.trim()
			.required('Indica por qué no es apta.')
			.max(RETURN_REASON_MAX, `Usa como máximo ${RETURN_REASON_MAX} caracteres.`),
	otherwise: (schema) => schema.notRequired(),
});

const returnConditionSchema = Yup.string()
	.oneOf(['fit', 'unfit'], 'Elige la condición.')
	.required('Elige la condición.');

const offeredWarehouseSchema = (offered: ReadonlySet<string>, requiredMessage: string) =>
	Yup.string()
		.required(requiredMessage)
		.test(
			'offered',
			'Esa bodega no es de la sucursal a la que vuelve el ítem.',
			(value) => !value || offered.has(value),
		);

/** Unidades por recibir de un ítem, para el mensaje de la suma. */
const unitsLabel = (count: number): string => (count === 1 ? '1 unidad' : `${count} unidades`);

/**
 * Esquema de un ítem. Adelanta lo que el backend valida con `RETURN_QUANTITY_MISMATCH`
 * y `UNFIT_REASON_REQUIRED`: sin serie, las partes suman exactamente lo esperado; con o
 * sin serie, lo no apto lleva motivo y cada bodega es de la sucursal del ítem.
 */
const buildReturnItemSchema = (
	item: ISaleReturnItem,
	offered: ReadonlySet<string>,
	warehouseBranches: ReadonlyMap<string, number>,
) => {
	if (item.serial_tracking) {
		return Yup.object({
			rows: Yup.array(),
			serials: Yup.array().of(
				Yup.object({
					serialNumber: Yup.string().required(),
					warehouseKey: offeredWarehouseSchema(offered, 'Elige dónde queda la serie.'),
					condition: returnConditionSchema,
					reason: returnReasonSchema,
				}),
			),
		});
	}

	return Yup.object({
		serials: Yup.array(),
		rows: Yup.array()
			.of(
				Yup.object({
					warehouseKey: offeredWarehouseSchema(offered, 'Elige una ubicación.'),
					quantity: Yup.number()
						.typeError('Indica la cantidad.')
						.required('Indica la cantidad.')
						.integer('Usa un número entero.')
						.min(1, 'Debe ser al menos 1.'),
					condition: returnConditionSchema,
					reason: returnReasonSchema,
				}),
			)
			.min(1, 'Agrega al menos una ubicación.'),
	})
		.test('receiving-branch', function receivingBranch(value) {
			if (item.branch_id !== null) return true;
			const branches = new Set(
				(value?.rows ?? [])
					.map((row) => warehouseBranches.get(row.warehouseKey ?? ''))
					.filter((id): id is number => id !== undefined),
			);
			if (branches.size === 1) return true;
			return this.createError({
				path: `${this.path}.summary`,
				message:
					branches.size === 0
						? 'El ítem no tiene sucursal: elige al menos una bodega de recepción.'
						: 'Las bodegas de un mismo ítem deben pertenecer a la misma sucursal.',
			});
		})
		.test('total', function matchesExpected(value) {
			const received = sumAllocatedRows(value?.rows ?? []);
			if (received === item.quantity_expected) return true;
			return this.createError({
				path: `${this.path}.summary`,
				message: `Las partes suman ${received} y vuelven ${unitsLabel(item.quantity_expected)}.`,
			});
		});
};

/**
 * `offeredByBranch` da, por sucursal, las claves de bodega que se pueden elegir
 * (siempre con `UNLOCATED_KEY`). Sin sucursal se ofrecen las bodegas de la filial;
 * una bodega concreta determina a qué sucursal vuelve el ítem sin serie.
 */
export const buildReturnReceiptSchema = (
	items: readonly ISaleReturnItem[],
	offeredByBranch: ReadonlyMap<number, ReadonlySet<string>>,
) => {
	const warehouseBranches = new Map<string, number>();
	offeredByBranch.forEach((keys, branchId) =>
		keys.forEach((key) => {
			if (key !== UNLOCATED_KEY) warehouseBranches.set(key, branchId);
		}),
	);
	const allOffered = new Set([UNLOCATED_KEY, ...warehouseBranches.keys()]);
	return Yup.object({
		items: Yup.object(
			Object.fromEntries(
				items.map((item) => [
					toItemKey(item.sale_item_id),
					buildReturnItemSchema(
						item,
						(item.branch_id !== null
							? offeredByBranch.get(item.branch_id)
							: allOffered) ?? new Set([UNLOCATED_KEY]),
						warehouseBranches,
					),
				]),
			),
		),
	});
};
