/**
 * PortTypeCounters — Desglose de puertos por tipo, un contador por tipo.
 *
 * Misma interacción que la grilla de «Cantidad de Puertos» del equipo: el técnico ya sabe
 * usarla y así el detalle no se captura de dos formas distintas en la misma pantalla.
 *
 * El valor es un mapa `{tipo: cantidad}`. Un tipo en cero se borra del mapa en vez de
 * quedar en 0, porque el backend rechaza las cantidades menores a 1.
 */
import React, { useId } from 'react';
import { StepperInput } from './StepperInput';
import {
	MAX_PORT_COUNT,
	setPortTypeCount,
	type PortTypeCounts,
} from '../validation/constants/ports.rules';

export interface PortTypeCountersProps {
	/** Rótulo del grupo; también lo nombra para los lectores de pantalla. */
	label: string;
	options: Array<{ value: string; label: string }>;
	value: PortTypeCounts;
	onChange: (next: PortTypeCounts) => void;
	/** Techo de cordura por tipo; el backend ya no impone ninguno. */
	max?: number;
	disabled?: boolean;
}

export const PortTypeCounters: React.FC<PortTypeCountersProps> = ({
	label,
	options,
	value,
	onChange,
	max = MAX_PORT_COUNT,
	disabled = false,
}) => {
	const labelId = useId();

	if (options.length === 0) return null;

	return (
		<div className='w-full'>
			<p
				id={labelId}
				className='mb-3 block text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
				{label}
			</p>
			<div
				role='group'
				aria-labelledby={labelId}
				className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
				{options.map((option) => (
					<div key={option.value} className='flex flex-col items-center gap-2'>
						<span className='text-[10px] font-bold uppercase tracking-widest text-zinc-500'>
							{option.label}
						</span>
						<div className='w-full max-w-[140px]'>
							<StepperInput
								label={option.label}
								value={value[option.value] ?? 0}
								onChange={(count) =>
									!disabled &&
									onChange(setPortTypeCount(value, option.value, count))
								}
								max={max}
								disabled={disabled}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default PortTypeCounters;
