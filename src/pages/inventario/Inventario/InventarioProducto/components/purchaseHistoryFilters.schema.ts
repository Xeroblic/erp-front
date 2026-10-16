import * as Yup from 'yup';
import type { IProductPurchaseHistoryFilters } from '@/interface/procurement.interface';

/** Filtros del historial de compras, como los guarda Formik (`''` = sin filtro). */
export interface IPurchaseHistoryFilterValues {
	supplier: string;
	receivedFrom: string;
	receivedTo: string;
}

export const PURCHASE_HISTORY_FILTERS_INITIAL_VALUES: IPurchaseHistoryFilterValues = {
	supplier: '',
	receivedFrom: '',
	receivedTo: '',
};

const BUSINESS_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Las mismas reglas que valida el backend (`ValidatesStockReceiptFilters`):
 * fechas `YYYY-MM-DD` y «hasta» no anterior a «desde». En ese formato el orden
 * de texto es el de las fechas.
 */
export const PurchaseHistoryFiltersSchema = Yup.object({
	supplier: Yup.string(),
	receivedFrom: Yup.string().matches(BUSINESS_DATE, {
		message: 'La fecha desde debe tener el formato AAAA-MM-DD.',
		excludeEmptyString: true,
	}),
	receivedTo: Yup.string()
		.matches(BUSINESS_DATE, {
			message: 'La fecha hasta debe tener el formato AAAA-MM-DD.',
			excludeEmptyString: true,
		})
		.test(
			'not-before-from',
			'La fecha hasta no puede ser anterior a la fecha desde.',
			(value, context) => {
				const { parent }: { parent: unknown } = context;
				const from =
					typeof parent === 'object' && parent !== null && 'receivedFrom' in parent
						? parent.receivedFrom
						: undefined;
				return !value || typeof from !== 'string' || !from || value >= from;
			},
		),
});

const isValidField = (
	field: keyof IPurchaseHistoryFilterValues,
	values: IPurchaseHistoryFilterValues,
) => {
	try {
		PurchaseHistoryFiltersSchema.validateSyncAt(field, values);
		return true;
	} catch {
		return false;
	}
};

/**
 * Parámetros del historial. Un filtro inválido no viaja: el backend
 * respondería 422 y el formulario ya lo marca en rojo.
 */
export const toPurchaseHistoryFilters = (
	values: IPurchaseHistoryFilterValues,
): IProductPurchaseHistoryFilters => {
	const filters: IProductPurchaseHistoryFilters = {};
	const supplierId = Number(values.supplier);
	if (values.supplier && Number.isInteger(supplierId) && supplierId > 0)
		filters.supplier_id = supplierId;
	if (values.receivedFrom && isValidField('receivedFrom', values))
		filters.received_from = values.receivedFrom;
	if (values.receivedTo && isValidField('receivedTo', values))
		filters.received_to = values.receivedTo;
	return filters;
};
