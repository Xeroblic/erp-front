import React, { useState, ReactNode } from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';

interface HiddenAsideProps {
	/**
	 * Content to display inside the aside panel
	 */
	children: ReactNode;
	/**
	 * Button icon (default: 'HeroChevronLeft')
	 */
	buttonIcon?: string;
	/**
	 * Aside width when expanded (default: 'w-80')
	 */
	asideWidth?: string;
	/**
	 * Background color theme (default: 'blue')
	 */
	color?: 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'zinc';
	/**
	 * Custom class for the aside content
	 */
	className?: string;
}

const HiddenAside: React.FC<HiddenAsideProps> = ({
	children,
	buttonIcon = 'HeroChevronLeft',
	asideWidth = 'w-80',
	color = 'blue',
	className,
}) => {
	const [isHovered, setIsHovered] = useState(false);

	const colorClasses = {
		blue: 'from-blue-500/20 to-blue-600/20 border-blue-400/30 shadow-blue-500/20',
		red: 'from-red-500/20 to-red-600/20 border-red-400/30 shadow-red-500/20',
		green: 'from-green-500/20 to-green-600/20 border-green-400/30 shadow-green-500/20',
		purple: 'from-purple-500/20 to-purple-600/20 border-purple-400/30 shadow-purple-500/20',
		amber: 'from-amber-500/20 to-amber-600/20 border-amber-400/30 shadow-amber-500/20',
		zinc: 'from-zinc-500/20 to-zinc-600/20 border-zinc-400/30 shadow-zinc-500/20',
	};

	const buttonColorClasses = {
		blue: 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/50',
		red: 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50',
		green: 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/50',
		purple: 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/50',
		amber: 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/50',
		zinc: 'bg-gradient-to-br from-zinc-500 to-zinc-600 hover:from-zinc-600 hover:to-zinc-700 shadow-zinc-500/50',
	};

	return (
		<div className='fixed right-0 top-0 z-50 flex h-screen items-center'>
			{/* Trigger Button */}
			<div
				className='relative'
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}>
				{/* Floating Button */}
				<button
					className={classNames(
						'animate-pulse',
						'rounded-l-full',
						'group relative flex h-16 w-8 items-center justify-center transition-all duration-300',
						'border-y border-l backdrop-blur-xl',
						buttonColorClasses[color],
						'shadow-lg hover:w-10 hover:shadow-xl',
						'transform hover:scale-105',
					)}>
					{/* Icon with animation */}
					<Icon
						icon={buttonIcon}
						className={classNames(
							'text-white transition-all duration-300',
							isHovered ? 'rotate-180 scale-110' : '',
						)}
						size='text-2xl'
					/>

					{/* Pulse effect on hover */}
					<span
						className={classNames(
							'absolute inset-0 rounded-l-full transition-opacity duration-300',
							buttonColorClasses[color],
							'opacity-0 blur-xl group-hover:opacity-30',
						)}
					/>
				</button>

				{/* Aside Panel */}
				<aside
					className={classNames(
						'fixed right-0 top-0 h-screen transition-all duration-500 ease-out',
						asideWidth,
						isHovered ? 'translate-x-0' : 'translate-x-full',
						'bg-gradient-to-br backdrop-blur-2xl',
						colorClasses[color],
						'border-y border-l shadow-2xl',
						'overflow-hidden',
					)}>
					{/* Decorative gradient overlay */}
					<div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent' />

					{/* Animated border glow */}
					<div
						className={classNames(
							'absolute inset-0 opacity-0 transition-opacity duration-500',
							isHovered ? 'opacity-100' : '',
						)}>
						<div className='absolute left-0 top-0 h-px w-full animate-pulse bg-gradient-to-r from-transparent via-white/50 to-transparent' />
					</div>

					{/* Content Container */}
					<div
						className={classNames(
							'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative h-full overflow-y-auto p-6',
							className,
						)}>
						{/* Fade-in animation for content */}
						<div
							className={classNames(
								'transform transition-all duration-700',
								isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
							)}>
							{children}
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default HiddenAside;
