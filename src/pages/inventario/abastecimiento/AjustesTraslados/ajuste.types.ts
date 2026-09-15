import * as Yup from 'yup';
import { LOCATION_TOKEN_PATTERN } from '@/utils/inventoryLocation.util';
import type { TStockCondition } from '@/interface/procurement.interface';

export interface IAjusteItemDraft {
	productId: number | '';
	/** Delta firmado: negativo es egreso, positivo es ingreso. Nunca cero. */
	quantityDelta: string;
	condition: TStockCondition;
	/** Sólo admisible en egresos; vacío significa «consumir FIFO». */
	originId: number | '';
}

export interface IAjusteFormValues {
	location: string;
	reason: string;
	notes: string;
	relatedStockReceiptId: number | '';
	items: IAjusteItemDraft[];
}

export const emptyAjusteItem = (): IAjusteItemDraft => ({
	productId: '',
	quantityDelta: '',
	condition: 'fit',
	originId: '',
});

/**
 * «Sin selección» en un `<select>` de id llega de dos formas: `''` desde
 * Formik y `undefined` desde el esquema, porque `prepareDataForValidation`
 * convierte la cadena vacía antes de validar. Las dos significan lo mismo, y
 * confundirlas invierte la regla: comparar sólo contra `''` daba por elegido
 * un origen que nadie eligió.
 */
export const hasId = (value: number | '' | null | undefined): value is number =>
	typeof value === 'number' && Number.isFinite(value);

/** Sin selección → `null` en el payload, nunca `NaN` ni `undefined`. */
export const optionalId = (value: number | '' | null | undefined): number | null =>
	hasId(value) ? value : null;

export const AjusteSchema = Yup.object({
	location: Yup.string()
		.matches(LOCATION_TOKEN_PATTERN, 'Selecciona una ubicación válida.')
		// `warehouse_id` es obligatorio aunque admita `null`: «Sin ubicación» es
		// una respuesta, no la ausencia de respuesta.
		.required('Indica la ubicación del ajuste.'),
	reason: Yup.string()
		.trim()
		.max(255, 'El motivo no puede superar los 255 caracteres.')
		.required('Indica el motivo del ajuste.'),
	// Sin `.defined()` en los opcionales: Formik convierte cadena vacía en
	// `undefined` antes de validar (`prepareDataForValidation`), así que un
	// `.defined()` acá rechazaría el formulario recién abierto, con el campo
	// simplemente en blanco.
	notes: Yup.string().max(1000, 'Las notas no pueden superar los 1000 caracteres.'),
	relatedStockReceiptId: Yup.mixed<number | ''>(),
	items: Yup.array()
		.of(
			Yup.object({
				productId: Yup.number()
					.typeError('Selecciona un producto.')
					.integer()
					.positive()
					.required('Selecciona un producto.'),
				quantityDelta: Yup.number()
					.typeError('La diferencia debe ser un entero distinto de cero.')
					.integer('La diferencia debe ser un entero distinto de cero.')
					.notOneOf([0], 'La diferencia debe ser distinta de cero.')
					.required('Indica la diferencia.'),
				condition: Yup.string()
					.oneOf(['fit', 'unfit'], 'Indica si las unidades son aptas o no aptas.')
					.required('Indica si las unidades son aptas o no aptas.'),
				originId: Yup.mixed<number | ''>(),
			}).defined(),
		)
		.min(1, 'Agrega al menos un producto al ajuste.')
		.test('sin-duplicados', 'Hay dos líneas del mismo producto y condición.', (items) => {
			const keys = (items ?? [])
				.filter((item) => Number.isFinite(item.productId))
				.map((item) => `${String(item.productId)}:${String(item.condition)}`);
			return new Set(keys).size === keys.length;
		})
		// «Un ingreso positivo no permite elegir un origen viejo»: crea un origen
		// desconocido de ajuste. El servicio devuelve 422
		// `ADJUSTMENT_ORIGIN_NOT_ALLOWED`; acá se atrapa antes de escribir.
		//
		// El error se ancla en `items[i].originId` con `createError`: un mensaje
		// colgado del arreglo no tiene control junto al que mostrarse, y el
		// usuario no sabría cuál de las líneas corregir.
		.test(
			'ingreso-sin-origen',
			'Un ingreso no puede atribuirse a una procedencia anterior.',
			function ingresoSinOrigen(items) {
				const offending = (items ?? []).findIndex(
					(item) => Number(item.quantityDelta) > 0 && hasId(item.originId),
				);
				if (offending === -1) return true;
				return this.createError({
					path: `${this.path}[${offending}].originId`,
					message: 'Un ingreso no puede atribuirse a una procedencia anterior.',
				});
			},
		)
		.defined(),
}).test(
	'egreso-con-origen-de-la-recepcion',
	'Con una recepción enlazada, cada egreso debe indicar un origen de esa recepción.',
	function egresoConOrigenDeLaRecepcion(values) {
		if (!hasId(values.relatedStockReceiptId)) return true;
		const offending = (values.items ?? []).findIndex(
			(item) => Number(item.quantityDelta) < 0 && !hasId(item.originId),
		);
		if (offending === -1) return true;
		return this.createError({
			path: `items[${offending}].originId`,
			message:
				'Con una recepción enlazada, el egreso debe indicar un origen de esa recepción.',
		});
	},
);
