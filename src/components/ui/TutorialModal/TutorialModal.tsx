import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import gsap from 'gsap';
import classNames from 'classnames';
import Portal from '@/components/layouts/Portal/Portal';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Progress from '@/components/ui/Progress';
import { TutorialModalProps, TutorialStep } from '@/components/types/TutorialModal';
import { useReactiveThemeConfig, adjustShade } from '@/hooks/useReactiveThemeConfig';
import { TColors } from '@/types/colors.type';
import { TColorIntensity } from '@/types/colorIntensities.type';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const TutorialModal: React.FC<TutorialModalProps> = ({
	steps,
	title = 'Tutorial',
	isOpen,
	setIsOpen,
}) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const backdropRef = useRef<HTMLDivElement>(null);
	const [activeIndex, setActiveIndex] = useState(0);
	const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

	// Use reactive theme from system
	const { themeColor, themeColorShade } = useReactiveThemeConfig();

	// Reset index when modal opens
	useEffect(() => {
		if (isOpen) {
			setActiveIndex(0);
			if (swiperInstance) {
				swiperInstance.slideTo(0, 0);
			}
		}
	}, [isOpen, swiperInstance]);

	// GSAP Animation on open
	useEffect(() => {
		if (isOpen && contentRef.current && backdropRef.current) {
			const tl = gsap.timeline();

			// Backdrop fade in
			tl.fromTo(
				backdropRef.current,
				{ opacity: 0 },
				{ opacity: 1, duration: 0.4, ease: 'power3.out' },
			);

			// Modal scale + slide in with 3D effect
			tl.fromTo(
				contentRef.current,
				{
					scale: 0.7,
					opacity: 0,
					y: 80,
					rotateX: -20,
					transformPerspective: 1000,
				},
				{
					scale: 1,
					opacity: 1,
					y: 0,
					rotateX: 0,
					duration: 0.6,
					ease: 'back.out(1.2)',
				},
				'-=0.2',
			);

			// Animate decorative elements
			const decorElements = contentRef.current.querySelectorAll('.decor-element');
			tl.fromTo(
				decorElements,
				{ scale: 0, opacity: 0 },
				{ scale: 1, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'back.out(2)' },
				'-=0.3',
			);
		}
	}, [isOpen]);

	const handleClose = () => {
		if (contentRef.current && backdropRef.current) {
			const tl = gsap.timeline({
				onComplete: () => {
					setIsOpen(false);
					setActiveIndex(0);
				},
			});

			tl.to(contentRef.current, {
				scale: 0.85,
				opacity: 0,
				y: 50,
				rotateX: 10,
				duration: 0.3,
				ease: 'power3.in',
			});

			tl.to(
				backdropRef.current,
				{
					opacity: 0,
					duration: 0.25,
					ease: 'power2.in',
				},
				'-=0.2',
			);
		} else {
			setIsOpen(false);
		}
	};

	const handlePrev = () => {
		if (swiperInstance && activeIndex > 0) {
			swiperInstance.slidePrev();
		}
	};

	const handleNext = () => {
		if (swiperInstance && activeIndex < steps.length - 1) {
			swiperInstance.slideNext();
		}
	};

	if (!isOpen) return null;

	const progressValue = ((activeIndex + 1) / steps.length) * 100;

	return (
		<Portal>
			<div
				ref={modalRef}
				className='fixed inset-0 z-[1060] flex items-center justify-center p-4 md:p-8'
				style={{ perspective: '1200px' }}>
				{/* Animated Backdrop */}
				<div
					ref={backdropRef}
					className='absolute inset-0 bg-black/70 backdrop-blur-xl'
					onClick={handleClose}>
					{/* Floating particles background */}
					<div className='absolute inset-0 overflow-hidden'>
						<div
							className={classNames(
								'absolute h-96 w-96 animate-pulse rounded-full opacity-20 blur-3xl',
								`bg-${themeColor}-${themeColorShade}`,
								'-left-48 top-1/4',
							)}
						/>
						<div
							className={classNames(
								'absolute h-80 w-80 animate-pulse rounded-full opacity-15 blur-3xl',
								`bg-${themeColor}-${themeColorShade}`,
								'-right-40 bottom-1/4',
							)}
							style={{ animationDelay: '1s' }}
						/>
					</div>
				</div>

				{/* Modal Content */}
				<div
					ref={contentRef}
					className={classNames(
						'relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden',
						'rounded-3xl bg-white dark:bg-zinc-900',
						'shadow-2xl',
					)}
					style={{ transformStyle: 'preserve-3d' }}>
					{/* Decorative SVG Background */}
					<div className='pointer-events-none absolute inset-0 overflow-hidden'>
						{/* Top right decoration */}
						<svg
							className={classNames(
								'decor-element absolute -right-20 -top-20 h-64 w-64 opacity-10 dark:opacity-5',
								`text-${themeColor}-${themeColorShade}`,
							)}
							viewBox='0 0 200 200'>
							<circle
								cx='100'
								cy='100'
								r='80'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'>
								<animateTransform
									attributeName='transform'
									type='rotate'
									from='0 100 100'
									to='360 100 100'
									dur='20s'
									repeatCount='indefinite'
								/>
							</circle>
							<circle
								cx='100'
								cy='100'
								r='60'
								fill='none'
								stroke='currentColor'
								strokeWidth='1.5'>
								<animateTransform
									attributeName='transform'
									type='rotate'
									from='360 100 100'
									to='0 100 100'
									dur='15s'
									repeatCount='indefinite'
								/>
							</circle>
							<circle
								cx='100'
								cy='100'
								r='40'
								fill='none'
								stroke='currentColor'
								strokeWidth='1'>
								<animateTransform
									attributeName='transform'
									type='rotate'
									from='0 100 100'
									to='360 100 100'
									dur='10s'
									repeatCount='indefinite'
								/>
							</circle>
						</svg>

						{/* Bottom left decoration */}
						<svg
							className={classNames(
								'decor-element absolute -bottom-16 -left-16 h-48 w-48 opacity-10 dark:opacity-5',
								`text-${themeColor}-${themeColorShade}`,
							)}
							viewBox='0 0 100 100'>
							<polygon
								points='50,10 90,90 10,90'
								fill='none'
								stroke='currentColor'
								strokeWidth='1'>
								<animateTransform
									attributeName='transform'
									type='rotate'
									from='0 50 50'
									to='360 50 50'
									dur='25s'
									repeatCount='indefinite'
								/>
							</polygon>
						</svg>
					</div>

					{/* Header with gradient */}
					<div
						className={classNames(
							'relative border-b border-gray-200/50 px-6 py-5 dark:border-zinc-700/50',
							`bg-${themeColor}-${themeColorShade}`,
						)}>
						{/* Animated background pattern */}
						<div className='absolute inset-0 overflow-hidden'>
							<svg
								className='absolute inset-0 h-full w-full opacity-10'
								preserveAspectRatio='none'>
								<pattern
									id='headerPattern'
									x='0'
									y='0'
									width='40'
									height='40'
									patternUnits='userSpaceOnUse'>
									<circle cx='20' cy='20' r='1' fill='white'>
										<animate
											attributeName='opacity'
											values='0.3;1;0.3'
											dur='3s'
											repeatCount='indefinite'
										/>
									</circle>
								</pattern>
								<rect width='100%' height='100%' fill='url(#headerPattern)' />
							</svg>
						</div>

						<div className='relative flex items-center justify-between'>
							<div className='flex items-center gap-4'>
								{/* Animated icon container */}
								<div className='relative'>
									<div className='absolute inset-0 animate-pulse rounded-2xl bg-white/30 blur' />
									<div className='relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm'>
										<Icon
											icon='HeroAcademicCap'
											className='text-3xl text-white'
										/>
									</div>
								</div>
								<div>
									<h2 className='text-2xl font-bold tracking-tight text-white'>
										{title}
									</h2>
									<div className='mt-1 flex items-center gap-2'>
										<span className='text-sm font-medium text-white/80'>
											Paso {activeIndex + 1} de {steps.length}
										</span>
										<span className='h-1.5 w-1.5 rounded-full bg-white/50' />
										<span className='text-sm text-white/60'>
											{steps[activeIndex]?.title}
										</span>
									</div>
								</div>
							</div>

							{/* Close button with glow */}
							<button
								onClick={handleClose}
								className='group relative flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20 active:scale-95'>
								<div className='absolute inset-0 rounded-full bg-white/20 opacity-0 blur transition-opacity group-hover:opacity-100' />
								<Icon icon='HeroXMark' className='relative text-2xl text-white' />
							</button>
						</div>

						{/* Progress bar */}
						<div className='absolute bottom-0 left-0 right-0 translate-y-1/2 transform px-6'>
							<div className='rounded-full border border-white/10 bg-white/20 p-1 backdrop-blur-sm'>
								<Progress
									value={progressValue}
									color={themeColor}
									colorIntensity={adjustShade(themeColorShade, -200)}
									rounded='rounded-full'
									className='h-2 bg-white/10'
								/>
							</div>
						</div>
					</div>

					{/* Step indicators */}
					<div className='flex justify-center gap-2 px-6 pb-4 pt-8'>
						{steps.map((_, index) => (
							<button
								key={index}
								onClick={() => swiperInstance?.slideTo(index)}
								className={classNames(
									'rounded-full transition-all duration-300',
									activeIndex === index
										? classNames(
												'h-3 w-10',
												`bg-${themeColor}-${themeColorShade}`,
												`ring-2 ring-${themeColor}-${themeColorShade}/30 ring-offset-2 dark:ring-offset-zinc-900`,
											)
										: 'h-3 w-3 bg-gray-300 hover:bg-gray-400 dark:bg-zinc-600 dark:hover:bg-zinc-500',
								)}
							/>
						))}
					</div>

					{/* Swiper Content */}
					<div className='relative flex-1 overflow-y-auto px-6'>
						<Swiper
							modules={[Navigation, Pagination]}
							spaceBetween={0}
							slidesPerView={1}
							allowTouchMove={true}
							onSwiper={(swiper) => setSwiperInstance(swiper)}
							onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
							className='w-full'>
							{steps.map((step, index) => (
								<SwiperSlide key={index}>
									<StepContent
										step={step}
										stepNumber={index + 1}
										themeColor={themeColor}
										themeColorShade={themeColorShade}
									/>
								</SwiperSlide>
							))}
						</Swiper>
					</div>

					{/* Footer with navigation - now with mt-auto to stick to bottom */}
					<div className='mt-auto border-t border-gray-200/50 bg-gray-50/50 px-6 py-5 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-800/30'>
						<div className='flex items-center justify-between'>
							{/* Step count */}
							<div className='flex items-center gap-3'>
								<div
									className={classNames(
										'flex items-center gap-2 rounded-xl px-4 py-2',
										`bg-${themeColor}-${themeColorShade}/10`,
										`text-${themeColor}-${themeColorShade}`,
									)}>
									<Icon icon='HeroBookOpen' className='text-lg' />
									<span className='text-sm font-semibold'>
										{activeIndex + 1} / {steps.length}
									</span>
								</div>
							</div>

							{/* Navigation buttons */}
							<div className='flex items-center gap-3'>
								<Button
									variant='outline'
									color='zinc'
									icon='HeroChevronLeft'
									onClick={handlePrev}
									isDisable={activeIndex === 0}
									className='px-4'>
									Anterior
								</Button>

								{activeIndex === steps.length - 1 ? (
									<Button
										variant='solid'
										color={themeColor}
										colorIntensity={themeColorShade}
										rightIcon='HeroCheck'
										onClick={handleClose}
										className='px-6 shadow-lg'>
										¡Entendido!
									</Button>
								) : (
									<Button
										variant='solid'
										color={themeColor}
										colorIntensity={themeColorShade}
										rightIcon='HeroChevronRight'
										onClick={handleNext}
										className='px-6 shadow-lg'>
										Siguiente
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Portal>
	);
};

// Enhanced Step Content Component
interface StepContentProps {
	step: TutorialStep;
	stepNumber: number;
	themeColor: TColors;
	themeColorShade: TColorIntensity;
}

const StepContent: React.FC<StepContentProps> = ({
	step,
	stepNumber,
	themeColor,
	themeColorShade,
}) => {
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (contentRef.current) {
			gsap.fromTo(
				contentRef.current.children,
				{ opacity: 0, y: 20 },
				{ opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
			);
		}
	}, [step]);

	// Image size classes mapping
	const imageSizeClasses = {
		xs: 'max-w-[200px] max-h-[120px]',
		sm: 'max-w-[300px] max-h-[180px]',
		md: 'max-w-[450px] max-h-[270px]',
		lg: 'max-w-[600px] max-h-[360px]',
		xl: 'max-w-[800px] max-h-[480px]',
		full: 'max-w-full max-h-[500px]',
	};

	// Combine legacy image with new images array
	const allImages = [
		...(step.image ? [{ src: step.image, size: 'md' as const, alt: step.title }] : []),
		...(step.images || []),
	];

	return (
		<div ref={contentRef} className='max-h-[55vh] min-h-[380px] overflow-y-auto py-6'>
			{/* Step header with icon */}
			<div className='mb-6 flex items-start gap-4'>
				{/* Step number badge */}
				<div
					className={classNames(
						'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl',
						`bg-${themeColor}-${themeColorShade}`,
						'shadow-lg',
					)}>
					{step.icon ? (
						<Icon icon={step.icon} className='text-2xl text-white' />
					) : (
						<span className='text-2xl font-bold text-white'>{stepNumber}</span>
					)}
				</div>

				<div className='flex-1'>
					<h3 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
						{step.title}
					</h3>
					{/* Description */}
					<div
						className='prose prose-sm max-w-none leading-relaxed text-gray-600 dark:prose-invert dark:text-gray-300'
						dangerouslySetInnerHTML={{ __html: step.description }}
					/>
				</div>
			</div>

			{/* Media section */}
			{(allImages.length > 0 || step.videoUrl) && (
				<div className='mt-6 space-y-4'>
					{/* Images grid/list */}
					{allImages.length > 0 && (
						<div
							className={classNames(
								'flex flex-wrap gap-4',
								allImages.length === 1 ? 'justify-center' : 'justify-start',
							)}>
							{allImages.map((img, idx) => {
								const size = img.size || 'md';
								return (
									<div
										key={idx}
										className={classNames(
											'relative overflow-hidden rounded-2xl',
											`border-2 border-${themeColor}-${themeColorShade}/30`,
											'group bg-zinc-900/50 shadow-xl',
											imageSizeClasses[size],
										)}>
										{/* Image overlay effect */}
										<div className='absolute inset-0 z-10 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
										<img
											src={img.src}
											alt={img.alt || step.title}
											className='h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]'
										/>
										{/* Corner decoration */}
										<div
											className={classNames(
												'absolute right-2 top-2 rounded-lg px-2 py-1',
												'bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90',
												'text-xs font-medium',
												`text-${themeColor}-${themeColorShade}`,
											)}>
											<Icon
												icon='HeroPhoto'
												className='mr-1 inline text-sm'
											/>
											{size.toUpperCase()}
										</div>
									</div>
								);
							})}
						</div>
					)}

					{step.videoUrl && (
						<div
							className={classNames(
								'relative overflow-hidden rounded-2xl',
								`border-2 border-${themeColor}-${themeColorShade}/30`,
								'aspect-video shadow-xl',
							)}>
							<iframe
								src={step.videoUrl}
								title={step.title}
								className='h-full w-full'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
							/>
							{/* Video decoration */}
							<div
								className={classNames(
									'absolute right-3 top-3 rounded-lg px-3 py-1.5',
									'bg-white/90 backdrop-blur-sm dark:bg-zinc-900/90',
									'text-xs font-medium',
									`text-${themeColor}-${themeColorShade}`,
								)}>
								<Icon icon='HeroPlayCircle' className='mr-1 inline' />
								Video
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default TutorialModal;
