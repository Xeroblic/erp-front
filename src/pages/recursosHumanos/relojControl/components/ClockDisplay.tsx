import React from 'react';
import { useLiveClock } from '../../hooks/useLiveClock';

const ClockDisplay: React.FC = () => {
	const { formattedTime, formattedDate } = useLiveClock();

	return (
		<div className='flex flex-col items-center justify-center gap-4 py-4 select-none'>
			<div className='relative group'>
				<div className='absolute -inset-4 rounded-full bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-20 dark:opacity-30 blur-2xl transition-all duration-1000 group-hover:opacity-40 dark:group-hover:opacity-50 animate-pulse' style={{ animationDuration: '3s' }} />
				
				<div className='relative flex items-center justify-center font-mono'>
					<span className='bg-gradient-to-br from-zinc-800 via-zinc-600 to-zinc-900 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-6xl font-black tracking-[0.15em] text-transparent drop-shadow-md md:text-7xl lg:text-[5rem]'>
						{formattedTime}
					</span>
				</div>
			</div>
			
			<div className='flex items-center gap-3 mt-2 opacity-80'>
				<div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-zinc-400 dark:to-zinc-600' />
				<p className='text-xs font-bold uppercase tracking-[0.3em] text-zinc-600 dark:text-zinc-400'>
					{formattedDate}
				</p>
				<div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-zinc-400 dark:to-zinc-600' />
			</div>
		</div>
	);
};

export default ClockDisplay;
