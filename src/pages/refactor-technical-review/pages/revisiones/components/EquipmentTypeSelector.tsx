import React from 'react';
import Icon from '@/components/icon/Icon';
import type { EquipmentType } from '@/store/slices/technicalReviews';

interface EquipmentOption {
	value: EquipmentType;
	label: string;
	icon: string;
}

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
	{ value: 'notebook', label: 'Notebook', icon: 'HeroComputerDesktop' },
	{ value: 'desktop', label: 'Desktop', icon: 'HeroServerStack' },
	{ value: 'aio', label: 'All-in-One', icon: 'HeroDeviceTablet' },
	{ value: 'docking', label: 'Docking', icon: 'HeroCpuChip' },
	{ value: 'monitor', label: 'Monitor', icon: 'HeroTv' },
];

interface EquipmentTypeSelectorProps {
	value: EquipmentType;
	onChange: (type: EquipmentType) => void;
	disabled?: boolean;
}

const EquipmentTypeSelector: React.FC<EquipmentTypeSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => {
	return (
		<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
			{EQUIPMENT_OPTIONS.map((option) => {
				const isSelected = value === option.value;
				return (
					<button
						key={option.value}
						type='button'
						disabled={disabled}
						onClick={() => onChange(option.value)}
						className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
							isSelected
								? 'border-blue-600 bg-blue-600/10 text-blue-600 shadow-lg shadow-blue-500/20 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400'
								: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
						} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
						<Icon
							icon={option.icon as any}
							className={`h-8 w-8 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}
						/>
						<span className='text-xs font-semibold'>{option.label}</span>
					</button>
				);
			})}
		</div>
	);
};

export default EquipmentTypeSelector;
