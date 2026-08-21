export interface FloatingInfoProps {
	label?: string;
	value?: string;
	icon?: React.ReactNode;
	color?: string;
	className?: string;
	colorText?: string;
	colorBg?: string;
	colorBorder?: string;
	onChange?: (value: string) => void;
	onClick?: () => void;
	disabled?: boolean;
	readOnly?: boolean;
	position?: 'top' | 'bottom' | 'left' | 'right';
	size?: 'small' | 'medium' | 'large';
}
