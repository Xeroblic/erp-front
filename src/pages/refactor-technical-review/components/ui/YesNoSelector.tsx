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
import React from 'react';
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export const YesNoSelector: React.FC<YesNoSelectorProps> = ({
	label,
	value,
	onChange,
	className,
}) => {
	return (
		<div className={`flex flex-col gap-2 ${className ?? ''}`}>
			<label className='block text-center text-sm font-bold dark:text-gray-300'>
				{label}
			</label>
			<div className='grid grid-cols-2 gap-4'>
				<SelectionCard
					label='Sí'
					value='yes'
					isSelected={value === true}
					onClick={() => onChange(true)}
					color='green'
					icon='HeroCheck'
					className='h-16 min-h-[60px]'
				/>
				<SelectionCard
					label='No'
					value='no'
					isSelected={value === false}
					onClick={() => onChange(false)}
					color='red'
					icon='HeroXMark'
					className='h-16 min-h-[60px]'
				/>
			</div>
		</div>
	);
};
