import React from 'react';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';

interface IStaleChipProps {
	className?: string;
}

/**
 * Aviso de borrador estancado (is_stale): hay equipos fuera del stock por un
 * retiro que nadie tocó en más de 24 h.
 */
const StaleChip: React.FC<IStaleChipProps> = ({ className = '' }) => (
	<Tooltip
		text='Este borrador lleva más de 24 h sin avanzar: los equipos siguen descontados del stock.'
		placement='top'>
		<span
			data-component-name='StaleChip'
			className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 ${className}`}>
			<Icon icon='HeroExclamationTriangle' className='h-3.5 w-3.5' />
			sin avanzar hace más de 24 h
		</span>
	</Tooltip>
);

export default StaleChip;
