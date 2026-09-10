import * as Yup from 'yup';
import { LOCATION_TOKEN_PATTERN } from '@/utils/inventoryLocation.util';
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
		// El servicio también lo rechaza (422 `MOVEMENT_SAME_LOCATION`); acá se
		// atrapa antes para no gastar una escritura en un error evitable.
		.notOneOf([Yup.ref('from')], 'El destino debe ser distinto del origen.'),
	reason: Yup.string()
		.trim()
		.max(255, 'El motivo no puede superar los 255 caracteres.')
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
					.required('Indica la cantidad.'),
				condition: Yup.string()
					.oneOf(['fit', 'unfit'], 'Indica si las unidades son aptas o no aptas.')
					.required('Indica si las unidades son aptas o no aptas.'),
			}).defined(),
		)
		.min(1, 'Agrega al menos un producto al traslado.')
		// Dos líneas del mismo par producto/condición serían una sola cantidad
		// escrita dos veces: el servicio devuelve 422 `MOVEMENT_DUPLICATE_ITEM`.
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
