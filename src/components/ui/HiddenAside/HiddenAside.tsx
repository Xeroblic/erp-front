import React, { useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import Badge from '../Badge';
import Button from '../Button';

interface HiddenAsideProps {
	children: ReactNode;
	buttonIcon?: string;
	asideWidth?: string | number;
	waveDuration?: number;
	className?: string;
}

const HiddenAside: React.FC<HiddenAsideProps> = ({
	children,
	buttonIcon = 'HeroChevronLeft',
	asideWidth = '100rem', // Default
	waveDuration = 0.8,
	className,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [isMobile, setIsMobile] = useState(false); // Estado para detectar mobile
	const asideRef = React.useRef<HTMLElement>(null);
	const [actualWidth, setActualWidth] = useState(0);

	// Detección de dispositivo móvil
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Determine if asideWidth is a Tailwind class
	const isTailwindClass =
		typeof asideWidth === 'string' &&
		(asideWidth.startsWith('w-') || asideWidth.startsWith('max-w-'));

	const styleWidth = isTailwindClass
		? undefined
		: typeof asideWidth === 'number'
			? `${asideWidth}px`
			: asideWidth;

	const widthClass = isTailwindClass ? asideWidth : undefined;

	// Measure width with ResizeObserver
	useEffect(() => {
		if (!asideRef.current) return;

		const element = asideRef.current;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentBoxSize) {
					setActualWidth(element.offsetWidth);
				}
			}
		});

		observer.observe(element);
		setActualWidth(element.offsetWidth);

		return () => {
			observer.disconnect();
		};
	}, [asideWidth]);

	// Lógica para manejar el clic en el botón (especialmente para mobile)
	const handleButtonClick = () => {
		if (isMobile) {
			setIsHovered(!isHovered);
		}
	};

	// --- LIQUID WAVE VARIANTS CORREGIDAS ---
	const curveVariants = {
		closed: {
			d: [
				'M100 0 L100 1000 Q20 500 100 0 Z',
				'M100 0 L100 1000 Q140 500 100 0 Z',
				'M100 0 L100 1000 Q100 500 100 0 Z',
			],
			transition: {
				duration: 0.6,
				times: [0, 0.4, 1],
				ease: 'circOut',
			},
		},
		open: {
			d: [
				'M100 0 L100 1000 Q100 500 100 0 Z',
				'M100 0 L100 1000 Q-80 500 100 0 Z',
				'M100 0 L100 1000 Q60 500 100 0 Z',
				'M100 0 L100 1000 Q20 500 100 0 Z',
			],
			transition: {
				duration: waveDuration,
				times: [0, 0.4, 0.7, 1],
				ease: [0.33, 1, 0.68, 1],
			},
		},
	};

	return (
		<div className='pointer-events-none fixed inset-0 z-[100] flex justify-end overflow-hidden'>
			{/* Hover Trap */}
			<div
				className='pointer-events-auto relative flex h-full items-center'
				onMouseLeave={() => !isMobile && setIsHovered(false)}>
				{/* --- TRIGGER BUTTON --- */}
				<motion.div
					onMouseEnter={() => !isMobile && setIsHovered(true)}
					animate={{
						x: isHovered && !isMobile ? -actualWidth + 45 : 0,
					}}
					transition={{
						duration: isHovered && !isMobile ? waveDuration : 0.6,
						ease: [0.33, 1, 0.68, 1],
					}}
					className={classNames(
						'relative z-[110] flex translate-y-[-50px] transform items-center justify-center',
						isMobile && 'w-8 h-20',
					)}>
					{/* El botón se muestra si no hay hover O si es mobile (para poder cerrar con click) */}
					{(isMobile || !isHovered) && (
						<Button
							onClick={handleButtonClick}
							className={classNames(
								'rounded-l-full',
								'flex h-20 w-6 items-center justify-center rounded-l-2xl',
								'bg-zinc-300 shadow-xl dark:bg-zinc-900',
								'group transition-all duration-300 hover:w-14',
							)}>
							<motion.div
								animate={{
									rotate: isHovered ? 0 : 180,
									scale: isHovered ? 1.2 : 1,
								}}
								className='relative z-10'>
								<Icon
									icon={buttonIcon}
									className='text-2xl text-zinc-700 dark:text-gray-300'
								/>
							</motion.div>
						</Button>
					)}
				</motion.div>

				{/* --- ASIDE PANEL --- */}
				<motion.aside
					ref={asideRef as any}
					initial={{ x: '100%', opacity: 0 }}
					animate={{
						x: isHovered ? '0%' : '100%',
						opacity: isHovered ? 1 : 0,
					}}
					transition={{
						duration: isHovered ? waveDuration : 0.5,
						ease: [0.33, 1, 0.68, 1],
					}}
					style={{ width: isMobile ? '85vw' : styleWidth }}
					className={classNames(
						'absolute right-0 top-0 flex h-screen bg-zinc-300 shadow-[-20px_0_30px_rgba(0,0,0,0.1)] dark:bg-zinc-900',
						widthClass,
					)}>
					{/* 1. SVG WAVE CURVE */}
					<svg
						className='pointer-events-none absolute -left-[99px] top-0 h-full w-[100px]'
						preserveAspectRatio='none'
						viewBox='0 0 100 1000'>
						<motion.path
							variants={curveVariants}
							animate={isHovered ? 'open' : 'closed'}
							className='fill-zinc-500 dark:fill-zinc-900'
						/>
					</svg>

					{/* 2. MAIN CONTENT CONTAINER */}
					<div
						className={classNames(
							'relative h-full w-full overflow-hidden transition-colors duration-300',
							'transparent dark:transparent',
						)}>
						<AnimatePresence mode='wait'>
							{isHovered && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className={classNames(
										'relative flex h-full w-full flex-col',
										className,
									)}>
									<div className='custom-scrollbar flex-1 overflow-y-auto p-6 text-zinc-900 dark:text-gray-200'>
										{children}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.aside>
			</div>
		</div>
	);
};

export default HiddenAside;
