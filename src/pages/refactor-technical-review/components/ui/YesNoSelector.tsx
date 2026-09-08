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
	/** Marca el campo como obligatorio: asterisco en el rótulo, que es el nombre accesible. */
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
	// Sin un contenedor con rol, las dos tarjetas quedan sueltas para el lector de pantalla
	// y pierden el nombre del campo, que sólo vive en el rótulo de arriba.
	const labelId = useId();

	return (
		<div className={`flex flex-col gap-2 ${className ?? ''}`}>
			<p className='block text-center text-sm font-bold dark:text-gray-300' id={labelId}>
				{label}
				{required && <span className='text-red-500'> *</span>}
			</p>
			{/*
			 * `role='group'`, no `radiogroup`: desde el refactor de roles ARIA (#189)
			 * `SelectionCard` es un botón de alternancia (`<button aria-pressed>`), y un
			 * `radiogroup` sin hijos `role='radio'` sería ARIA inválido. Es el mismo criterio
			 * que ese refactor aplicó a los grupos de `InputSection` y `ScreenSection`, y que
			 * `DockingExtrasSection` sigue en el bloque del candado.
			 *
			 * Sin `aria-required`, que no es válido en `role='group'`: la obligatoriedad se
			 * anuncia por el asterisco del rótulo al que apunta `aria-labelledby`.
			 */}
			<div role='group' aria-labelledby={labelId} className='grid grid-cols-2 gap-4'>
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
