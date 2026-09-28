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
		.max(255, 'El motivo no puede superar los 255 caracteres.')
		.required('Indica el motivo del ajuste.'),
	// Sin `.defined()` en los opcionales: Formik convierte cadena vacía en
	// `undefined` antes de validar (`prepareDataForValidation`), así que un
	// `.defined()` acá rechazaría el formulario recién abierto, con el campo
	// simplemente en blanco.
	notes: Yup.string().max(1000, 'Las notas no pueden superar los 1000 caracteres.'),
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
					.required('Indica la cantidad de ajuste.'),
				condition: Yup.string()
					.oneOf(['fit', 'unfit'], 'Indica si las unidades son aptas o no aptas.')
					.required('Indica si las unidades son aptas o no aptas.'),
			}).defined(),
		)
		.min(1, 'Agrega al menos un producto al ajuste.')
		.test('sin-duplicados', 'Hay dos líneas del mismo producto y condición.', (items) => {
			const keys = (items ?? [])
				.filter((item) => Number.isFinite(item.productId))
				.map((item) => `${String(item.productId)}:${String(item.condition)}`);
			return new Set(keys).size === keys.length;
		})
		.defined(),
});
