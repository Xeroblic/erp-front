import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';
import gsap from 'gsap';
import { FloatingInfoProps } from '../../types/FloatingInfo';
import { TutorialStep } from '../../types/TutorialModal';
import Icon from '@/components/icon/Icon';
import TutorialModal from '../TutorialModal/TutorialModal';
import { useReactiveThemeConfig } from '@/hooks/useReactiveThemeConfig';

interface EnhancedFloatingInfoProps
	extends Omit<FloatingInfoProps, 'onChange' | 'onClick' | 'readOnly'> {
	/** Tutorial steps - si se provee, al hacer click abre el modal */
	tutorialSteps?: TutorialStep[];
	/** Título del tutorial */
	tutorialTitle?: string;
}

const FloatingInfo: React.FC<EnhancedFloatingInfoProps> = ({
	label,
	value,
	icon,
	className,
	position = 'left',
	size = 'medium',
	disabled = false,
	tutorialSteps,
	tutorialTitle,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isTutorialOpen, setIsTutorialOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const ringRefs = useRef<(SVGCircleElement | null)[]>([]);
	const location = useLocation();

	// Use reactive theme from system
	const { themeColor, themeColorShade } = useReactiveThemeConfig();
	const hasTutorial = tutorialSteps && tutorialSteps.length > 0;

	// Size config - moved before useEffect that depends on it
	const sizeConfig = {
		small: { container: 'w-12 h-12', icon: 'text-lg', ring: 24 },
		medium: { container: 'w-14 h-14', icon: 'text-xl', ring: 28 },
		large: { container: 'w-16 h-16', icon: 'text-2xl', ring: 32 },
	};

	const currentSize = sizeConfig[size];

	// GSAP Ring pulse animation - using radius animation to keep circles round
	useEffect(() => {
		if (hasTutorial && !disabled && ringRefs.current.length > 0) {
			const rings = ringRefs.current.filter(Boolean) as SVGCircleElement[];
			const baseRadius = currentSize.ring;

			const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

			rings.forEach((ring, index) => {
				// Animate the 'r' attribute directly to avoid scale deformation
				tl.fromTo(
					ring,
					{
						attr: { r: baseRadius },
						opacity: 0.6,
					},
					{
						attr: { r: baseRadius * (2 + index * 0.3) },
						opacity: 0,
						duration: 1.5,
						ease: 'power2.out',
					},
					index * 0.2,
				);
			});

			return () => {
				tl.kill();
			};
		}
	}, [hasTutorial, disabled, currentSize.ring]);

	// GSAP Hover animation with glow
	useEffect(() => {
		if (buttonRef.current && !disabled) {
			if (isHovered) {
				gsap.to(buttonRef.current, {
					scale: 1.2,
					duration: 0.4,
					ease: 'elastic.out(1, 0.5)',
				});
			} else {
				gsap.to(buttonRef.current, {
					scale: 1,
					duration: 0.3,
					ease: 'power2.out',
				});
			}
		}
	}, [isHovered, disabled]);

	// Get current path and format it nicely
	const currentPath = location.pathname;
	const pathSegments = currentPath.split('/').filter(Boolean);
	const formattedPath =
		pathSegments.length > 0
			? pathSegments
					.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
					.join(' / ')
			: 'Inicio';

	const displayLabel = label || formattedPath;
	const displayValue = value;

	// Position classes for the info panel
	const positionClasses = {
		left: 'right-full mr-4',
		right: 'left-full ml-4',
		top: 'bottom-full mb-4',
		bottom: 'top-full mt-4',
	};

	const handleClick = () => {
		if (!disabled && hasTutorial) {
			// Click animation
			if (buttonRef.current) {
				gsap.timeline()
					.to(buttonRef.current, {
						scale: 0.85,
						duration: 0.1,
						ease: 'power2.in',
					})
					.to(buttonRef.current, {
						scale: 1.1,
						duration: 0.2,
						ease: 'back.out(2)',
					})
					.to(buttonRef.current, {
						scale: 1,
						duration: 0.15,
						ease: 'power2.out',
					});
			}
			setTimeout(() => setIsTutorialOpen(true), 150);
		}
	};

	// Store ring refs properly
	const setRingRef = (index: number) => (el: SVGCircleElement | null) => {
		ringRefs.current[index] = el;
	};

	return (
		<>
			<div
				ref={containerRef}
				className={classNames(
					'fixed bottom-[50vh] right-6 z-50 flex items-center justify-end',
					className,
					{
						'cursor-not-allowed opacity-50': disabled,
					},
				)}
				onMouseEnter={() => !disabled && setIsHovered(true)}
				onMouseLeave={() => !disabled && setIsHovered(false)}>
				{/* Info Panel - appears on hover */}
				<div
					className={classNames(
						'duration-400 absolute whitespace-nowrap transition-all ease-out',
						positionClasses[position],
						{
							'invisible translate-x-4 scale-95 opacity-0':
								!isHovered && position === 'left',
							'visible translate-x-0 scale-100 opacity-100':
								isHovered && (position === 'left' || position === 'right'),
							'invisible -translate-x-4 scale-95 opacity-0':
								!isHovered && position === 'right',
							'invisible translate-y-4 scale-95 opacity-0':
								!isHovered && position === 'top',
							'visible translate-y-0 scale-100 opacity-100':
								isHovered && (position === 'top' || position === 'bottom'),
							'invisible -translate-y-4 scale-95 opacity-0':
								!isHovered && position === 'bottom',
						},
					)}>
					<div
						className={classNames(
							'rounded-2xl border-2 px-5 py-4 shadow-2xl backdrop-blur-xl',
							`bg-${themeColor}-${themeColorShade}/10`,
							`border-${themeColor}-${themeColorShade}/30`,
						)}>
						<div className='flex flex-col gap-2'>
							<div
								className={classNames(
									'text-base font-bold',
									`text-${themeColor}-${themeColorShade}`,
								)}>
								{displayLabel}
							</div>
							{displayValue && (
								<div
									className={classNames(
										'text-sm opacity-80',
										`text-${themeColor}-${themeColorShade}`,
									)}>
									{displayValue}
								</div>
							)}
							{hasTutorial && (
								<div
									className={classNames(
										'mt-1 flex items-center gap-2 border-t pt-2 text-xs font-medium',
										`border-${themeColor}-${themeColorShade}/30`,
										`text-${themeColor}-${themeColorShade}`,
									)}>
									<Icon
										icon='HeroPlayCircle'
										className='animate-pulse text-base'
									/>
									Click para ver tutorial
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Floating Button with animated rings */}
				<div className='relative'>
					{/* SVG Animated rings */}
					{hasTutorial && !disabled && (
						<svg
							className='pointer-events-none absolute inset-0'
							style={{
								width: `${currentSize.ring * 3}px`,
								height: `${currentSize.ring * 3}px`,
								left: '50%',
								top: '50%',
								transform: 'translate(-50%, -50%)',
							}}>
							{[0, 1, 2].map((i) => (
								<circle
									key={i}
									ref={setRingRef(i)}
									cx='50%'
									cy='50%'
									r={currentSize.ring}
									fill='none'
									className={`stroke-${themeColor}-${themeColorShade}`}
									strokeWidth='2'
									opacity='0.6'
								/>
							))}
						</svg>
					)}

					{/* Main button */}
					<button
						ref={buttonRef}
						type='button'
						disabled={disabled}
						onClick={handleClick}
						className={classNames(
							'relative flex items-center justify-center rounded-full backdrop-blur-sm',
							'border-2 shadow-lg transition-colors duration-300',
							currentSize.container,
							`bg-${themeColor}-${themeColorShade}/15`,
							`border-${themeColor}-${themeColorShade}/30`,
							`text-${themeColor}-${themeColorShade}`,
							{
								'cursor-pointer hover:border-opacity-100': !disabled && hasTutorial,
								'cursor-default': !hasTutorial,
							},
						)}>
						{/* Inner glow effect */}
						{hasTutorial && (
							<div
								className={classNames(
									'absolute inset-2 rounded-full opacity-30 blur-sm',
									`bg-${themeColor}-${themeColorShade}`,
								)}
							/>
						)}

						{/* Icon */}
						<div className='relative z-10'>
							{icon || (
								<Icon
									icon={hasTutorial ? 'HeroQuestionMarkCircle' : 'HeroMapPin'}
									className={currentSize.icon}
								/>
							)}
						</div>

						{/* Sparkle effect on hover */}
						{isHovered && hasTutorial && (
							<div className='absolute inset-0 overflow-hidden rounded-full'>
								<div
									className={classNames(
										'absolute h-8 w-8 animate-ping rounded-full opacity-30 blur-md',
										`bg-${themeColor}-${themeColorShade}`,
									)}
									style={{
										left: '50%',
										top: '50%',
										transform: 'translate(-50%, -50%)',
									}}
								/>
							</div>
						)}
					</button>

					{/* Tutorial badge indicator */}
					{hasTutorial && !disabled && (
						<div
							className={classNames(
								'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full',
								'animate-bounce text-xs font-bold text-white shadow-lg',
								`bg-${themeColor}-${themeColorShade}`,
							)}
							style={{ animationDuration: '2s' }}>
							?
						</div>
					)}
				</div>
			</div>

			{/* Tutorial Modal */}
			{hasTutorial && (
				<TutorialModal
					steps={tutorialSteps}
					title={tutorialTitle || displayLabel}
					isOpen={isTutorialOpen}
					setIsOpen={setIsTutorialOpen}
				/>
			)}
		</>
	);
};

export default FloatingInfo;
