import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { FloatingInfoProps } from '../../types/FloatingInfo';
import Icon from '@/components/icon/Icon';

const FloatingInfo: React.FC<FloatingInfoProps> = ({
	label,
	value,
	icon,
	color = 'blue',
	className,
	colorText,
	colorBg,
	colorBorder,
	position = 'left',
	size = 'medium',
	disabled = false,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const location = useLocation();

	// Get current path and format it nicely
	const currentPath = location.pathname;
	const pathSegments = currentPath.split('/').filter(Boolean);
	const formattedPath = pathSegments.length > 0 
		? pathSegments.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' / ')
		: 'Inicio';

	// Determine what to display
	const displayLabel = label || formattedPath;
	const displayValue = value;

	// Size classes
	const sizeClasses = {
		small: 'w-10 h-10 text-xs',
		medium: 'w-12 h-12 text-sm',
		large: 'w-14 h-14 text-base',
	};

	// Position classes for the info panel
	const positionClasses = {
		left: 'right-full mr-3',
		right: 'left-full ml-3',
		top: 'bottom-full mb-3',
		bottom: 'top-full mt-3',
	};

	// Color mappings for inline styles
	const colorMap: Record<string, { bg: string; border: string; text: string; textLight: string }> = {
		blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)', text: '#1d4ed8', textLight: '#3b82f6' },
		emerald: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)', text: '#047857', textLight: '#10b981' },
		amber: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)', text: '#d97706', textLight: '#f59e0b' },
		red: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)', text: '#dc2626', textLight: '#ef4444' },
		purple: { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)', text: '#7c3aed', textLight: '#a855f7' },
	};

	const colors = colorMap[color] || colorMap.blue;

	return (
		<div
			className={classNames(
				'fixed bottom-[50vh] right-6 z-50 flex items-center justify-end',
				className,
				{
					'opacity-50 cursor-not-allowed': disabled,
				}
			)}
			onMouseEnter={() => !disabled && setIsHovered(true)}
			onMouseLeave={() => !disabled && setIsHovered(false)}
		>
			{/* Info Panel - appears on hover */}
			<div
				className={classNames(
					'absolute whitespace-nowrap transition-all duration-300 ease-in-out',
					positionClasses[position],
					{
						'opacity-0 invisible translate-x-2': !isHovered && position === 'left',
						'opacity-100 visible translate-x-0': (isHovered && position === 'left') || (isHovered && position === 'right'),
						'opacity-0 invisible -translate-x-2': !isHovered && position === 'right',
						'opacity-0 invisible translate-y-2': !isHovered && position === 'top',
						'opacity-100 visible translate-y-0': (isHovered && position === 'top') || (isHovered && position === 'bottom'),
						'opacity-0 invisible -translate-y-2': !isHovered && position === 'bottom',
					}
				)}
			>
				<div
					className="rounded-lg shadow-lg backdrop-blur-sm px-4 py-3 border"
					style={{
						backgroundColor: colorBg || colors.bg,
						borderColor: colorBorder || colors.border,
						color: colorText || colors.text,
					}}
				>
					<div className="flex flex-col gap-1">
						<div className="font-semibold text-sm">
							{displayLabel}
						</div>
						{displayValue && (
							<div 
								className="text-xs opacity-80"
								style={{
									color: colorText || colors.textLight,
								}}
							>
								{displayValue}
							</div>
						)}
						<div 
							className="text-xs mt-1 pt-1 border-t opacity-60"
							style={{
								borderColor: colorBorder || colors.border,
							}}
						>
							{currentPath}
						</div>
					</div>
				</div>
			</div>

			{/* Floating Button */}
			<button
				type="button"
				disabled={disabled}
				className={classNames(
					'rounded-full shadow-xl backdrop-blur-sm transition-all duration-300 flex items-center justify-center border',
					sizeClasses[size],
					{
						'hover:scale-110 hover:shadow-2xl': !disabled,
						'cursor-pointer': !disabled,
					}
				)}
				style={{
					backgroundColor: colorBg || colors.bg,
					borderColor: colorBorder || colors.border,
					color: colorText || colors.text,
				}}
			>
				{icon || (
					<Icon
						icon="HeroMapPin"
						className={size === 'small' ? 'text-lg' : size === 'large' ? 'text-2xl' : 'text-xl'}
					/>
				)}
			</button>
		</div>
	);
};

export default FloatingInfo;
