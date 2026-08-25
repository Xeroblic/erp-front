import React from 'react';
import Checkbox from '@/components/form/Checkbox';

interface NoHardwareToggleProps {
	isActive: boolean;
	hardwareLabel: string;
	onToggle: (active: boolean) => void;
	disabled?: boolean;
}

const NoHardwareToggle: React.FC<NoHardwareToggleProps> = ({
	isActive,
	hardwareLabel,
	onToggle,
	disabled = false,
}) => (
	<Checkbox
		variant='switch'
		dimension='sm'
		color='blue'
		checked={!isActive}
		disabled={disabled}
		inputClassName={isActive ? '!border-red-500 !bg-red-500' : undefined}
		label={`Tiene ${hardwareLabel}`}
		onChange={(event) => onToggle(!event.target.checked)}
	/>
);

export default NoHardwareToggle;
