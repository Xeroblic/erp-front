/**
 * StepperInput — Incrementador/Decrementador numérico con botones +/-.
 *
 * Uso:
 *   <StepperInput value={portCount} onChange={(n) => setValue('usb_a', n)} min={0} max={10} />
 */
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepperInputProps {
	/** Valor numérico actual */
	value: number;
	/** Handler cuando el valor cambia */
	onChange: (val: number) => void;
	/** Valor mínimo permitido. Default: 0 */
	min?: number;
	/** Valor máximo permitido. Default: 99 */
	max?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StepperInput: React.FC<StepperInputProps> = ({
	value,
	onChange,
	min = 0,
	max = 99,
}) => {
	const handleDecrement = () => {
		if (value > min) onChange(value - 1);
	};

	const handleIncrement = () => {
		if (value < max) onChange(value + 1);
	};

	return (
		<div className='flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900'>
			<button
				type='button'
				onClick={handleDecrement}
				disabled={value <= min}
				aria-label='Decrementar'
				className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200'>
				−
			</button>
			<span
				className='w-12 text-center text-2xl font-bold dark:text-white'
				aria-live='polite'>
				{value}
			</span>
			<button
				type='button'
				onClick={handleIncrement}
				disabled={value >= max}
				aria-label='Incrementar'
				className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50'>
				+
			</button>
		</div>
	);
};
