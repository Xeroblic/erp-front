// src/pages/recursosHumanos/relojControl/components/ClockDisplay.tsx
import React from 'react';
import { useLiveClock } from '../../hooks/useLiveClock';

const ClockDisplay: React.FC = () => {
	const { formattedTime, formattedDate } = useLiveClock();

	return (
		<div className='flex flex-col items-center gap-1'>
			{/* Hora */}
			<div className='font-mono text-5xl font-bold tracking-wider text-zinc-100 md:text-6xl'>
				{formattedTime}
			</div>
			{/* Fecha */}
			<p className='text-sm capitalize text-zinc-400'>{formattedDate}</p>
		</div>
	);
};

export default ClockDisplay;
