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

/** El backend persiste su propio snapshot de la tasa; esta sólo alimenta la previsualización. */
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

/** Un costo desconocido se muestra como tal, nunca como $0. */
export const isUnknownCost = (cost: IProcurementCost): boolean =>
	cost.source === 'unknown' || cost.effective_unit_amount === null;

/** Su `effective_unit_amount` no es comparable contra un neto ni contra un bruto. */
export const isMixedBasisCost = (cost: IProcurementCost): boolean =>
	cost.effective_basis === 'mixed';

/** El contrato anula monto y base ingresados cuando el costo no viene de un único monto. */
export const isAggregatedCost = (cost: IProcurementCost): boolean =>
	cost.entered_unit_amount === null || cost.entered_basis === null;

export interface IProcurementCostPreview {
	net_unit_amount: TDecimalString;
	vat_unit_amount: TDecimalString;
	gross_unit_amount: TDecimalString;
	vat_rate_percent: TDecimalString;
}

/**
 * Mismo redondeo que el contrato:
 * - `net`: IVA = neto × 0,19 half-up a 2; bruto = neto + IVA.
 * - `gross`: neto = bruto / 1,19 half-up a 2; IVA = bruto − neto.
 *
 * Sólo para mostrar: el contrato rechaza que el cliente envíe IVA, neto o bruto.
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
