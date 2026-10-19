import { normalizeCostInput } from '@/components/procurement';
import { previewCostBreakdown } from '@/utils/procurementCost.util';
import {
	formatDecimalAmount,
	formatDecimalCents,
	parseDecimalString,
} from '@/utils/procurementDecimal.util';
import type { IPurchaseDocumentFormValues } from '../types';

/**
 * Totales con IVA que el formulario de documento muestra mientras se escribe.
 * Sólo informativos: el backend recalcula los montos al guardar.
 */

/**
 * Total bruto de una línea, en centavos. `null` mientras falte una cantidad
 * entera positiva, la base o un costo legible.
 */
export const getLineGrossTotalCents = (
	quantity: string,
	unitCost: string,
	basis: 'net' | 'gross' | '',
): bigint | null => {
	const parsedQuantity = Number(quantity);
	if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0 || basis === '') return null;
	const preview = previewCostBreakdown(normalizeCostInput(unitCost), basis);
	const unitCents = preview ? parseDecimalString(preview.gross_unit_amount) : null;
	return unitCents === null ? null : unitCents * BigInt(parsedQuantity);
};

export const formatGrossTotal = (cents: bigint | null) =>
	cents === null ? null : formatDecimalAmount(formatDecimalCents(cents), 'CLP');

/** Envío como una línea de cantidad 1; `null` si no se agrega o no se puede calcular. */
export const getShippingTotalCents = (values: IPurchaseDocumentFormValues): bigint | null =>
	values.include_shipping
		? getLineGrossTotalCents('1', values.shipping_cost, values.shipping_cost_basis)
		: null;

/** Suma de las líneas calculables más el envío; las incompletas cuentan 0. */
export const getDocumentTotalCents = (values: IPurchaseDocumentFormValues): bigint =>
	values.items.reduce(
		(total, line) =>
			total +
			(getLineGrossTotalCents(line.quantity, line.unit_cost, line.unit_cost_basis) ?? 0n),
		getShippingTotalCents(values) ?? 0n,
	);
