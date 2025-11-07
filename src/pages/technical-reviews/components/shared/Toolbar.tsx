/**
 * Toolbar - Barra de herramientas reutilizable para acciones de página
 */
import React from 'react';
import Button from '@/components/ui/Button';
import type { TColors } from '@/types/colors.type';
import type { TIcons } from '@/types/icons.type';

interface ToolbarAction {
	label: string;
	icon: TIcons;
	onClick: () => void;
	color?: TColors;
	variant?: 'solid' | 'outline' | 'default';
	disabled?: boolean;
}

interface ToolbarProps {
	actions: ToolbarAction[];
	title?: string;
	className?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ actions, title, className = '' }) => {
	return (
		<div
			className={`flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${className}`}>
			{title && (
				<h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{title}</h2>
			)}

			<div className='flex items-center gap-2'>
				{actions.map((action, index) => (
					<Button
						key={index}
						icon={action.icon}
						onClick={action.onClick}
						color={action.color}
						variant={action.variant || 'solid'}
						isDisable={action.disabled}>
						{action.label}
					</Button>
				))}
			</div>
		</div>
	);
};

export default Toolbar;
