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
	/**
	 * Qué se está contando, para nombrar los botones y el valor.
	 *
	 * Una grilla de contadores repite «Incrementar» tantas veces como tipos tenga, y
	 * quien navega con lector de pantalla no puede saber cuál es cuál.
	 */
	label?: string;
	/** Bloquea los dos botones en modo lectura. */
	disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StepperInput: React.FC<StepperInputProps> = ({
	value,
	onChange,
	min = 0,
	max = 99,
	label,
	disabled = false,
}) => {
	const describe = (action: string) => (label ? `${action} ${label}` : action);

	const handleDecrement = () => {
		if (!disabled && value > min) onChange(value - 1);
	};

	const handleIncrement = () => {
		if (!disabled && value < max) onChange(value + 1);
	};

	return (
		<div className='flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900'>
			<button
				type='button'
				onClick={handleDecrement}
				disabled={disabled || value <= min}
				aria-label={describe('Decrementar')}
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
				disabled={disabled || value >= max}
				aria-label={describe('Incrementar')}
				className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50'>
				+
			</button>
		</div>
	);
};
