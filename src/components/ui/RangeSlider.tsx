/**
 * RangeSlider.tsx
 * Componente de slider reutilizable para selección de valores numéricos.
 * Visualiza el valor actual y permite arrastrar para cambiar.
 */
import React, { useRef, useState, useEffect } from 'react';

interface RangeSliderProps {
	value: number;
	onChange: (val: number) => void;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
	unit?: string;
	className?: string;
	disabled?: boolean;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	label,
	unit = '',
	className = '',
	disabled = false,
}) => {
	const progress = ((value - min) / (max - min)) * 100;

	// Determinar color basado en el progreso (solo visual)
	const getTrackColor = () => {
		if (disabled) return 'bg-gray-200 dark:bg-gray-700';
		if (progress < 33) return 'bg-blue-500';
		if (progress < 66) return 'bg-indigo-500';
		return 'bg-violet-500';
	};

	return (
		<div
			className={`w-full select-none space-y-3 ${className} ${disabled ? 'opacity-60' : ''}`}>
			{label && (
				<div className='flex items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300'>
					<span>{label}</span>
					<span className='rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'>
						{value}
						{unit}
					</span>
				</div>
			)}
			<div className='relative flex h-6 items-center'>
				{/* Track Background */}
				<div className='absolute h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700'>
					{/* Progress Bar */}
					<div
						className={`h-full transition-all duration-100 ${getTrackColor()}`}
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Native Input Range (Invisible but Functional) */}
				<input
					type='range'
					min={min}
					max={max}
					step={step}
					value={value || 0}
					onChange={(e) => onChange(Number(e.target.value))}
					disabled={disabled}
					className='absolute z-10 h-full w-full cursor-pointer opacity-0'
				/>

				{/* Custom Thumb Handle (Visual) */}
				<div
					className='pointer-events-none absolute h-5 w-5 rounded-full border-2 border-white bg-white shadow-md ring-1 ring-black/10 transition-all duration-100 dark:bg-zinc-200'
					style={{
						left: `calc(${progress}% - 10px)`, // Centrar el thumb
					}}
				/>
			</div>
			<div className='flex justify-between px-1 text-xs text-zinc-400'>
				<span>
					{min}
					{unit}
				</span>
				<span>
					{max}
					{unit}
				</span>
			</div>
		</div>
	);
};

export default RangeSlider;
