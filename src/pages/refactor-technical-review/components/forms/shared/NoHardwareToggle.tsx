import React from 'react';
import Icon from '@/components/icon/Icon';

export interface NoHardwareToggleProps {
	isActive: boolean;
	onToggle: (active: boolean) => void;
	label: string;
	readOnly?: boolean;
}

export const NoHardwareToggle: React.FC<NoHardwareToggleProps> = ({
	isActive,
	onToggle,
	label,
	readOnly = false,
}) => (
	<button
		type='button'
		disabled={readOnly}
		onClick={() => onToggle(!isActive)}
		className={`inline-flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all duration-200 ${
			isActive
				? 'border-red-400 bg-red-100 text-red-800 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200'
				: 'border-dashed border-zinc-300 bg-white text-zinc-500 hover:border-red-300 hover:bg-red-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-red-700 dark:hover:bg-red-900/20'
		} ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} `}>
		<Icon icon={isActive ? 'HeroXMark' : 'HeroExclamationTriangle'} className='h-4 w-4' />
		{label}
		{isActive && (
			<span className='ml-1 rounded bg-red-200 px-1.5 py-0.5 text-xs dark:bg-red-700'>
				Activo
			</span>
		)}
	</button>
);
