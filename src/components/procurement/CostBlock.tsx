import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { IProcurementCost } from '@/interface/procurement.interface';
import {
	COST_CALCULATION_LABELS,
	COST_EFFECTIVE_BASIS_LABELS,
	COST_ENTERED_BASIS_LABELS,
	COST_SOURCE_LABELS,
	isAggregatedCost,
	isMixedBasisCost,
	isUnknownCost,
} from '@/utils/procurementCost.util';
import { formatDecimalAmount } from '@/utils/procurementDecimal.util';

/**
 * Lectura del bloque `cost` del contrato de abastecimiento.
 *
 * Tres cosas que este componente existe para no volver a discutir en cada card:
 *
 * 1. Un costo desconocido se muestra **desconocido**, nunca como `$0`. El
 *    contrato manda importes y tasa en `null`, y `null` formateado como moneda
 *    da $0, que es una afirmación falsa sobre lo que se pagó.
 * 2. Un agregado con `effective_basis: "mixed"` se distingue de uno con base
 *    única: su costo efectivo no es comparable contra un neto ni contra un bruto
 *    sin decir cuál.
 * 3. Lo que se ve es lo que devolvió el servidor. La previsualización local del
 *    IVA vive en `CostInput` y no llega hasta acá.
 */

export interface ICostBlockProps {
	cost: IProcurementCost;
	/** Oculta el desglose neto / IVA / bruto en contextos densos. */
	showBreakdown?: boolean;
	className?: string;
}

const UNKNOWN_TEXT = 'Desconocido';

const AmountRow: FC<{ label: string; amount: string | null; emphasis?: boolean }> = ({
	label,
	amount,
	emphasis = false,
}) => (
	<div className='flex items-baseline justify-between gap-4'>
		<span className='text-sm text-zinc-500 dark:text-zinc-400'>{label}</span>
		<span
			className={classNames(
				'tabular-nums',
				emphasis ? 'text-base font-semibold' : 'text-sm',
				amount === null && 'italic text-zinc-500 dark:text-zinc-400',
			)}>
			{amount ?? UNKNOWN_TEXT}
		</span>
	</div>
);

const CostBlock: FC<ICostBlockProps> = ({ cost, showBreakdown = true, className }) => {
	const isUnknown = isUnknownCost(cost);
	const isMixed = isMixedBasisCost(cost);
	const isAggregated = isAggregatedCost(cost);
	const currency = cost.currency_code;

	const enteredBasisLabel =
		cost.entered_basis === null ? null : COST_ENTERED_BASIS_LABELS[cost.entered_basis];

	return (
		<section
			data-component-name='Procurement/CostBlock'
			data-cost-source={cost.source}
			data-effective-basis={cost.effective_basis}
			className={classNames(
				'rounded-xl border p-3',
				isUnknown
					? 'border-dashed border-zinc-300 dark:border-zinc-700'
					: 'border-zinc-200 dark:border-zinc-700',
				className,
			)}>
			{isUnknown ? (
				<p className='flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300'>
					<Icon
						icon='HeroQuestionMarkCircle'
						className='h-5 w-5 shrink-0 text-zinc-400'
						aria-hidden='true'
					/>
					{/* Sin importes no hay nada que desglosar: se dice que se
					    desconoce el costo, en vez de pintar una tabla de ceros. */}
					<span>Costo de compra desconocido</span>
				</p>
			) : (
				<>
					<div className='flex items-baseline justify-between gap-4'>
						<span className='text-sm text-zinc-500 dark:text-zinc-400'>
							{isAggregated ? 'Costo agregado' : 'Costo ingresado'}
						</span>
						<span className='text-sm tabular-nums'>
							{formatDecimalAmount(cost.entered_unit_amount, currency) ?? '—'}
							{enteredBasisLabel !== null && (
								<span className='ml-1 text-xs text-zinc-500 dark:text-zinc-400'>
									({enteredBasisLabel.toLocaleLowerCase('es-CL')})
								</span>
							)}
						</span>
					</div>

					{showBreakdown && (
						<div className='mt-2 space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-700'>
							<AmountRow
								label='Neto'
								amount={formatDecimalAmount(cost.net_unit_amount, currency)}
							/>
							<AmountRow
								label={
									cost.vat_rate_percent === null
										? 'IVA'
										: `IVA ${cost.vat_rate_percent}%`
								}
								amount={formatDecimalAmount(cost.vat_unit_amount, currency)}
							/>
							<AmountRow
								label='Bruto'
								amount={formatDecimalAmount(cost.gross_unit_amount, currency)}
							/>
						</div>
					)}

					<div className='mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700'>
						<AmountRow
							label='Costo efectivo'
							amount={formatDecimalAmount(cost.effective_unit_amount, currency)}
							emphasis
						/>
						{isMixed && (
							// El agregado mixto se marca aquí, no sólo con una etiqueta
							// al pie: es lo que impide compararlo como si fuera neto.
							<p className='mt-1 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400'>
								<Icon
									icon='HeroExclamationTriangle'
									className='mt-0.5 h-3.5 w-3.5 shrink-0'
									aria-hidden='true'
								/>
								<span>
									Combina líneas con bases distintas: no es comparable contra un
									neto ni contra un bruto.
								</span>
							</p>
						)}
					</div>
				</>
			)}

			<div className='mt-3 flex flex-wrap gap-1.5'>
				<Badge
					variant='outline'
					color={cost.effective_basis === 'mixed' ? 'amber' : 'zinc'}
					className='text-xs'>
					Base efectiva: {COST_EFFECTIVE_BASIS_LABELS[cost.effective_basis]}
				</Badge>
				<Badge
					variant='outline'
					color={cost.source === 'document' ? 'emerald' : 'zinc'}
					className='text-xs'>
					{COST_SOURCE_LABELS[cost.source]}
				</Badge>
				<Badge variant='outline' color='zinc' className='text-xs'>
					{COST_CALCULATION_LABELS[cost.calculation]}
				</Badge>
			</div>
		</section>
	);
};

export default CostBlock;
