import React from 'react';
import NoHardwareToggle from './NoHardwareToggle';
import HardwareAbsenceStatus from './HardwareAbsenceStatus';

type HardwareCardAccent = 'blue' | 'purple';

interface HardwareCardProps {
	title: string;
	accent: HardwareCardAccent;
	isAbsent: boolean;
	onToggleAbsence: (absent: boolean) => void;
	hardwareLabel: string;
	readOnly: boolean;
	isRequired?: boolean;
	children: React.ReactNode;
}

const ACCENT_STYLES: Record<HardwareCardAccent, { container: string; title: string }> = {
	blue: {
		container:
			'border-blue-200 bg-blue-500/20 hover:bg-blue-500/30 dark:border-blue-800 dark:bg-blue-900/10 dark:hover:bg-blue-900/30',
		title: 'text-blue-800 dark:text-blue-200',
	},
	purple: {
		container:
			'border-purple-200 bg-purple-500/20 hover:bg-purple-500/30 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/30',
		title: 'text-purple-800 dark:text-purple-200',
	},
};

/**
 * Tarjeta de hardware (RAM / Almacenamiento) del wizard de revisión técnica.
 *
 * El switch «Tiene …» vive en el header de la tarjeta. Al desactivar, la tarjeta
 * permanece visible en estado colapsado y atenuado mostrando «No tiene …»,
 * y el switch sigue operable para revertir. En readOnly el switch se oculta
 * y la ausencia se muestra con la misma tarjeta colapsada.
 */
const HardwareCard: React.FC<HardwareCardProps> = ({
	title,
	accent,
	isAbsent,
	onToggleAbsence,
	hardwareLabel,
	readOnly,
	isRequired = false,
	children,
}) => {
	const tokens = ACCENT_STYLES[accent];

	return (
		<div
			className={`rounded-xl border p-4 transition-all duration-200 ${tokens.container} ${
				isAbsent ? 'opacity-60 saturate-[0.85]' : 'hover:cursor-pointer'
			}`}>
			<div className='mb-3 flex items-center justify-between gap-3'>
				<h4 className={`text-sm font-bold ${tokens.title}`}>
					{title}
					{isRequired && <span className='text-red-500'> *</span>}
				</h4>
				{!readOnly && (
					<NoHardwareToggle
						isActive={isAbsent}
						onToggle={onToggleAbsence}
						hardwareLabel={hardwareLabel}
					/>
				)}
			</div>
			{isAbsent ? <HardwareAbsenceStatus hardwareLabel={hardwareLabel} /> : children}
		</div>
	);
};

export default HardwareCard;
