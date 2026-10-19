import React, { FC } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import type { TStockCondition } from '@/interface/procurement.interface';

export const CONDITION_LABELS: Record<TStockCondition, string> = {
	fit: 'Apto',
	unfit: 'No apto',
};

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

/** El no apto se destaca en ámbar: decide si las unidades pueden venderse. */
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
