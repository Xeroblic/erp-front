import React from 'react';
import Progress from '@/components/ui/Progress';
import classNames from 'classnames';

interface WarehouseCapacityBarProps {
	current: number;
	maximum: number | null;
	showLabel?: boolean;
	size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente visual para mostrar la capacidad de una bodega
 */
const WarehouseCapacityBar: React.FC<WarehouseCapacityBarProps> = ({
	current,
	maximum,
	showLabel = true,
	size = 'md',
}) => {
	// Si no hay capacidad máxima definida, mostrar ilimitado
	if (maximum === null || maximum === 0) {
		return (
			<div className='flex items-center gap-2'>
				{showLabel && (
					<span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
						{current} unidades (Ilimitado)
					</span>
				)}
			</div>
		);
	}

	const percentage = Math.min((current / maximum) * 100, 100);
	const available = Math.max(maximum - current, 0);

	// Determinar color según porcentaje
	const getColor = () => {
		if (percentage >= 90) return 'red';
		if (percentage >= 70) return 'amber';
		return 'emerald';
	};

	const heightClass = {
		sm: 'h-1.5',
		md: 'h-2',
		lg: 'h-3',
	}[size];

	return (
		<div className='space-y-1'>
			{showLabel && (
				<div className='flex items-center justify-between text-sm'>
					<span className='font-medium text-gray-700 dark:text-gray-300'>
						{current} / {maximum} unidades
					</span>
					<span className='text-gray-500 dark:text-gray-400'>
						{available} disponibles
					</span>
				</div>
			)}
			<div className='relative'>
				<Progress value={percentage} max={100} color={getColor()} className={heightClass} />
			</div>
			{showLabel && (
				<div className='text-right text-xs text-gray-500 dark:text-gray-400'>
					{percentage.toFixed(1)}% ocupado
				</div>
			)}
		</div>
	);
};

export default WarehouseCapacityBar;
