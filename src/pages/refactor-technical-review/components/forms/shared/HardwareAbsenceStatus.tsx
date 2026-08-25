import React from 'react';
import Icon from '@/components/icon/Icon';

interface HardwareAbsenceStatusProps {
	hardwareLabel: string;
}

const HardwareAbsenceStatus: React.FC<HardwareAbsenceStatusProps> = ({ hardwareLabel }) => (
	<div className='flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100/60 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/40'>
		<Icon icon='HeroXCircle' className='h-4 w-4 shrink-0 text-zinc-400' />
		<p className='text-sm font-medium text-zinc-500 dark:text-zinc-400'>
			No tiene {hardwareLabel}
		</p>
	</div>
);

export default HardwareAbsenceStatus;
