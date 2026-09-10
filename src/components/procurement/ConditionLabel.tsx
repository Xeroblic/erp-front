import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import type { TStockCondition } from '@/interface/procurement.interface';

/**
 * Texto que el contrato asigna a cada condición. Vive acá y no en cada
 * pantalla por el mismo motivo que `UNLOCATED_WAREHOUSE_LABEL`: «No apto» tiene
 * que leerse igual en stock, traslados y ajustes, en vez de aparecer como
 * «Dañado» en una pantalla y «unfit» en otra.
 */
export const CONDITION_LABELS: Record<TStockCondition, string> = {
	fit: 'Apto',
	unfit: 'No apto',
};

/** Opciones para los selects de condición de traslados y ajustes, en orden estable. */
export const CONDITION_OPTIONS: readonly { value: TStockCondition; label: string }[] = [
	{ value: 'fit', label: CONDITION_LABELS.fit },
	{ value: 'unfit', label: CONDITION_LABELS.unfit },
];

export interface IConditionLabelProps {
	condition: TStockCondition;
	/** Oculta el icono cuando el contexto ya lo aporta (una celda de tabla densa). */
	withIcon?: boolean;
	className?: string;
}

/**
 * Etiqueta de condición del módulo de abastecimiento.
 *
 * El no apto se destaca en ámbar —igual que la columna «No apto» de
 * `StockPorUbicacion`— porque en un traslado o un ajuste es la información que
 * decide si las unidades pueden venderse, no un matiz decorativo.
 */
const ConditionLabel: FC<IConditionLabelProps> = ({ condition, withIcon = true, className }) => {
	const isUnfit = condition === 'unfit';

	return (
		<span
			data-component-name='Procurement/ConditionLabel'
			data-condition={condition}
			className={classNames('inline-flex items-center gap-1', className)}>
			{withIcon && (
				<Icon
					icon={isUnfit ? 'HeroExclamationTriangle' : 'HeroCheckCircle'}
					className={classNames(
						'h-4 w-4 shrink-0',
						isUnfit ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600',
					)}
				/>
			)}
			<span
				className={classNames(
					isUnfit && 'font-semibold text-amber-700 dark:text-amber-300',
				)}>
				{CONDITION_LABELS[condition]}
			</span>
		</span>
	);
};

export default ConditionLabel;
