/**
 * YesNoSelector — Selector binario Sí/No usando SelectionCard.
 *
 * Uso:
 *   <YesNoSelector
 *     label="¿Incluye cargador?"
 *     value={includesCharger}
 *     onChange={(val) => setValue('includes_charger', val)}
 *   />
 */
import React, { useId } from 'react';
import { SelectionCard } from './SelectionCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface YesNoSelectorProps {
	/** Label visible sobre las tarjetas */
	label: string;
	/** Valor actual: true = Sí, false = No, null/undefined = ninguno */
	value: boolean | undefined | null;
	/** Handler cuando el usuario selecciona Sí o No */
	onChange: (val: boolean) => void;
	/** Clases CSS adicionales para el contenedor */
	className?: string;
	/** Marca el campo como obligatorio (asterisco visible y `aria-required`). */
	required?: boolean;
	/** Impide la interacción cuando el formulario está en modo lectura. */
	disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const YesNoSelector: React.FC<YesNoSelectorProps> = ({
	label,
	value,
	onChange,
	className,
	required = false,
	disabled = false,
}) => {
	// Las dos tarjetas son `role="radio"`: sin un `radiogroup` que las agrupe quedan
	// huérfanas para el lector de pantalla y pierden el nombre del campo.
	const labelId = useId();

	return (
		<div className={`flex flex-col gap-2 ${className ?? ''}`}>
			<p className='block text-center text-sm font-bold dark:text-gray-300' id={labelId}>
				{label}
				{required && <span className='text-red-500'> *</span>}
			</p>
			<div
				role='radiogroup'
				aria-labelledby={labelId}
				aria-required={required}
				className='grid grid-cols-2 gap-4'>
				<SelectionCard
					label='Sí'
					value='yes'
					isSelected={value === true}
					onClick={() => onChange(true)}
					disabled={disabled}
					color='green'
					icon='HeroCheck'
					className='h-16 min-h-[60px]'
				/>
				<SelectionCard
					label='No'
					value='no'
					isSelected={value === false}
					onClick={() => onChange(false)}
					disabled={disabled}
					color='red'
					icon='HeroXMark'
					className='h-16 min-h-[60px]'
				/>
			</div>
		</div>
	);
};
