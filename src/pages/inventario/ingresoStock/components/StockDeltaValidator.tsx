import React, { useEffect } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import { useStockDelta } from '../hooks/useStockDelta';
import type { IStockBranchAllocation } from '../types';

interface StockDeltaValidatorProps {
	totalSubsidiaryStock: number;
	allocations: IStockBranchAllocation[];
	onValidationChange?: (isValid: boolean) => void;
}

/**
 * Componente Visual para Validar Delta de Stock (UI_UX)
 */
export const StockDeltaValidator: React.FC<StockDeltaValidatorProps> = ({
	totalSubsidiaryStock,
	allocations,
	onValidationChange,
}) => {
	const { isBalanced, delta, message, sumAllocations } = useStockDelta({
		totalSubsidiaryStock,
		allocations,
	});

	// Emitir validación al padre
	useEffect(() => {
		onValidationChange?.(isBalanced);
	}, [isBalanced, onValidationChange]);

	const bgColor = isBalanced
		? 'bg-emerald-50 dark:bg-emerald-900/20'
		: 'bg-rose-50 dark:bg-rose-900/20';
	const textColor = isBalanced
		? 'text-emerald-700 dark:text-emerald-400'
		: 'text-rose-700 dark:text-rose-400';
	const iconColor = isBalanced ? 'text-emerald-500' : 'text-rose-500';
	const iconName = isBalanced ? 'HeroCheckCircle' : 'HeroExclamationTriangle';

	return (
		<Card className={`border border-transparent ${bgColor} shadow-none`}>
			<CardBody className='flex items-start gap-3 p-4'>
				<Icon
					icon={iconName as any}
					className={`mt-0.5 h-6 w-6 flex-shrink-0 ${iconColor}`}
				/>
				<div className='flex-1'>
					<h4 className={`text-sm font-bold ${textColor}`}>
						Balance de Stock Inter-Sucursal
					</h4>
					<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
						<strong>Total Subsidiaria:</strong> {totalSubsidiaryStock} |{' '}
						<strong>Suma Sucursales:</strong> {sumAllocations}
					</p>
					{!isBalanced && (
						<p className={`mt-2 font-medium ${textColor}`}>
							{message} (Delta: {delta})
						</p>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default StockDeltaValidator;
