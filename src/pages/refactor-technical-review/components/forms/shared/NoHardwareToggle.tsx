import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface NoHardwareToggleProps {
	isActive: boolean;
	label: string;
	onToggle: (active: boolean) => void;
	disabled?: boolean;
}

const NoHardwareToggle: React.FC<NoHardwareToggleProps> = ({
	isActive,
	label,
	onToggle,
	disabled = false,
}) => (
	<Button
		type='button'
		variant='outline'
		color={isActive ? 'red' : 'zinc'}
		size='sm'
		isActive={isActive}
		disabled={disabled}
		aria-pressed={isActive}
		onClick={() => onToggle(!isActive)}>
		<Icon icon={isActive ? 'HeroXMark' : 'HeroExclamationTriangle'} className='mr-1 h-4 w-4' />
		{label}
	</Button>
);

export default NoHardwareToggle;
