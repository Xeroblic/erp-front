import type {
	IProcurementCost,
	TCostCalculation,
	TCostEffectiveBasis,
	TCostEnteredBasis,
	TCostEntryBasis,
	TCostSource,
	TDecimalString,
} from '@/interface/procurement.interface';
import {
	divideRoundHalfUp,
	formatDecimalCents,
	parseDecimalString,
} from '@/utils/procurementDecimal.util';

/**
 * Lectura y previsualización del bloque `cost` del contrato de abastecimiento.
 *
 * La UI puede previsualizar el cálculo del IVA, pero presenta el resultado del
 * servidor: `previewCostBreakdown` existe para dar feedback mientras se digita,
 * no para reemplazar lo que devuelve el backend.
 */

/** Tasa de IVA afecta de V1. El backend persiste su propio snapshot. */
export const PROCUREMENT_VAT_RATE_PERCENT: TDecimalString = '19.00';

const VAT_RATE_NUMERATOR = 19n;
const VAT_RATE_DENOMINATOR = 100n;
const GROSS_NUMERATOR = 119n;

export const COST_SOURCE_LABELS: Record<TCostSource, string> = {
	document: 'Respaldado por documento',
	declared: 'Declarado sin documento',
	unknown: 'Origen desconocido',
};

export const COST_CALCULATION_LABELS: Record<TCostCalculation, string> = {
	single_price: 'Precio único',
	weighted_within_receipt: 'Ponderado dentro de la recepción',
	unknown: 'Cálculo desconocido',
};

export const COST_ENTERED_BASIS_LABELS: Record<TCostEnteredBasis, string> = {
	net: 'Neto',
	gross: 'Bruto',
	unknown: 'Base desconocida',
};

export const COST_EFFECTIVE_BASIS_LABELS: Record<TCostEffectiveBasis, string> = {
	net: 'Neto',
	gross: 'Bruto',
	mixed: 'Bases mixtas',
	unknown: 'Base desconocida',
};

export const COST_ENTRY_BASIS_LABELS: Record<TCostEntryBasis, string> = {
	net: 'Neto',
	gross: 'Bruto',
};

/**
 * Costo desconocido: importes y tasa `null`, bases `unknown`, `source: unknown`.
 * Un costo así se muestra como desconocido y nunca como $0.
 */
export const isUnknownCost = (cost: IProcurementCost): boolean =>
	cost.source === 'unknown' || cost.effective_unit_amount === null;

/**
 * Agregado que combina bases efectivas distintas. Se distingue de una base única
 * porque su `effective_unit_amount` no es comparable contra un neto ni contra un
 * bruto sin decir cuál.
 */
export const isMixedBasisCost = (cost: IProcurementCost): boolean =>
	cost.effective_basis === 'mixed';

/**
 * Agregado heterogéneo: el contrato anula `entered_unit_amount` y
 * `entered_basis` cuando el agregado no proviene de un único monto ingresado.
 */
export const isAggregatedCost = (cost: IProcurementCost): boolean =>
	cost.entered_unit_amount === null || cost.entered_basis === null;

export interface IProcurementCostPreview {
	net_unit_amount: TDecimalString;
	vat_unit_amount: TDecimalString;
	gross_unit_amount: TDecimalString;
	vat_rate_percent: TDecimalString;
}

/**
 * Previsualización local del desglose neto / IVA / bruto, con las mismas reglas
 * de redondeo del contrato:
 * - Entrada `net`: IVA = neto × 0,19 half-up a 2; bruto = neto + IVA.
 * - Entrada `gross`: neto = bruto / 1,19 half-up a 2; IVA = bruto − neto.
 *
 * Devuelve `null` si el monto no es un decimal válido. **No se envía al
 * backend**: el contrato rechaza que el cliente mande IVA, neto o bruto
 * derivados.
 */
export const previewCostBreakdown = (
	amount: string | null | undefined,
	basis: TCostEntryBasis,
): IProcurementCostPreview | null => {
	const enteredCents = parseDecimalString(amount);
	if (enteredCents === null || enteredCents < 0n) return null;

	let netCents: bigint;
	let vatCents: bigint;
	let grossCents: bigint;

	if (basis === 'net') {
		netCents = enteredCents;
		vatCents = divideRoundHalfUp(netCents * VAT_RATE_NUMERATOR, VAT_RATE_DENOMINATOR);
		grossCents = netCents + vatCents;
	} else {
		grossCents = enteredCents;
		netCents = divideRoundHalfUp(grossCents * VAT_RATE_DENOMINATOR, GROSS_NUMERATOR);
		vatCents = grossCents - netCents;
	}

	return {
		net_unit_amount: formatDecimalCents(netCents),
		vat_unit_amount: formatDecimalCents(vatCents),
		gross_unit_amount: formatDecimalCents(grossCents),
		vat_rate_percent: PROCUREMENT_VAT_RATE_PERCENT,
	};
};

/**
 * Payload de escritura del costo. Es **todo** lo que el contrato acepta: monto y
 * base. Se expone como helper para que ningún formulario caiga en la tentación
 * de adjuntar el desglose previsualizado.
 */
export const buildCostEntryPayload = (
	amount: TDecimalString,
	basis: TCostEntryBasis,
): { unit_cost: TDecimalString; unit_cost_basis: TCostEntryBasis } => ({
	unit_cost: amount,
	unit_cost_basis: basis,
});
