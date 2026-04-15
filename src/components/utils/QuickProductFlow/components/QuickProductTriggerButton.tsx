import React from 'react';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import Icon from '@/components/icon/Icon';

interface QuickProductTriggerButtonProps {
	onClick: () => void;
	disabled?: boolean;
	tooltip?: string;
	className?: string;
}

export const QuickProductTriggerButton: React.FC<QuickProductTriggerButtonProps> = ({
	onClick,
	disabled = false,
	tooltip = 'Crear producto rápido',
	className,
}) => {
	return (
		<Tooltip text={tooltip}>
			<Button
				variant='solid'
				color='blue'
				onClick={onClick}
				disabled={disabled}
				className={className}>
				<Icon icon='HeroPlus' className='text-2xl font-bold text-white' />
			</Button>
		</Tooltip>
	);
};
