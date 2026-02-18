import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldValues } from 'react-hook-form';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { SectionConfig, FormSectionProps } from './types';

interface FormShellProps<T extends FieldValues> {
	sections: SectionConfig<T>[];
	sectionProps: FormSectionProps<T>;
	onBack: () => void;
	onFinish: () => void;
	isSubmitting?: boolean;
}

function FormShell<T extends FieldValues>({
	sections,
	sectionProps,
	onBack,
	onFinish,
	isSubmitting = false,
}: FormShellProps<T>) {
	const [step, setStep] = useState(0);
	const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

	const MAX_STEPS = sections.length;

	// Scroll to top on step change
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [step]);

	const handleNext = () => {
		if (step < MAX_STEPS - 1) {
			setDirection(1);
			setStep((s) => s + 1);
		}
	};

	const handlePrev = () => {
		if (step > 0) {
			setDirection(-1);
			setStep((s) => s - 1);
		} else {
			onBack();
		}
	};

	const handleStepClick = (index: number) => {
		if (sectionProps.readOnly || index === step) {
			if (index !== step) {
				setDirection(index > step ? 1 : -1);
				setStep(index);
			}
			return;
		}
		// Allow navigating backwards freely, forward only 1 step at a time
		if (index < step) {
			setDirection(-1);
			setStep(index);
		} else if (index === step + 1) {
			setDirection(1);
			setStep(index);
		}
	};

	const currentSection = sections[step];
	const SectionComponent = currentSection.component;

	const isLastStep = step === MAX_STEPS - 1;

	return (
		<div className='flex flex-col gap-0'>
			{/* ─── Step Navigation Bar ─────────────────────────────────── */}
			<div className='overflow-x-auto rounded-t-2xl border border-zinc-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 dark:border-zinc-700 dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-800/80'>
				<div className='flex items-center justify-between px-4 py-3'>
					{sections.map((section, index) => {
						const isActive = index === step;
						const isCompleted = index < step;
						const isClickable =
							sectionProps.readOnly || index < step || index === step + 1;

						return (
							<React.Fragment key={section.key}>
								{/* Step Item */}
								<button
									type='button'
									onClick={() => handleStepClick(index)}
									disabled={!isClickable && !isActive}
									className={`group relative flex flex-col items-center gap-1.5 transition-all ${
										isClickable || isActive
											? 'cursor-pointer'
											: 'cursor-default opacity-50'
									}`}>
									{/* Icon Circle */}
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
											isActive
												? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-900/50'
												: isCompleted
													? 'bg-blue-500 text-white'
													: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
										}`}>
										{isCompleted && !isActive ? (
											<Icon
												icon='HeroCheck'
												className='h-6 w-6 !text-white'
											/>
										) : (
											<Icon
												icon={section.icon}
												className={`h-6 w-6 ${isActive ? '!text-white' : ''}`}
											/>
										)}
									</div>

									{/* Label */}
									<span
										className={`whitespace-nowrap text-[10px] font-semibold transition-colors ${
											isActive
												? 'text-blue-700 dark:text-blue-300'
												: isCompleted
													? 'text-blue-500 dark:text-blue-400'
													: 'text-zinc-400 dark:text-zinc-500'
										}`}>
										{section.label}
									</span>
								</button>

								{/* Connector Line */}
								{index < sections.length - 1 && (
									<div className='mx-1 mt-[-12px] flex-1'>
										<div
											className={`h-0.5 w-full rounded-full transition-colors ${
												index < step
													? 'bg-blue-500'
													: 'bg-zinc-200 dark:bg-zinc-700'
											}`}
										/>
									</div>
								)}
							</React.Fragment>
						);
					})}
				</div>
			</div>

			{/* ─── Section Content ─────────────────────────────────────── */}
			<div className='relative min-h-[400px] overflow-hidden rounded-b-2xl border border-t-0 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
				<AnimatePresence mode='wait' custom={direction}>
					<motion.div
						key={step}
						custom={direction}
						initial={{ opacity: 0, x: direction * 40 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: direction * -40 }}
						transition={{ duration: 0.25, ease: 'easeInOut' }}
						className='p-6'>
						<h3 className='mb-6 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							<Icon icon={currentSection.icon} className='h-5 w-5 text-blue-600' />
							{currentSection.label}
						</h3>
						<SectionComponent {...sectionProps} />
					</motion.div>
				</AnimatePresence>
			</div>

			{/* ─── Footer Navigation ───────────────────────────────────── */}
			<div className='mt-4 flex items-center justify-between'>
				<Button
					variant='outline'
					onClick={handlePrev}
					disabled={isSubmitting}
					className='gap-2'>
					<Icon icon='HeroArrowLeft' className='h-4 w-4' />
					{step === 0 ? 'Volver' : 'Anterior'}
				</Button>

				{/* Progress Dots */}
				<div className='flex gap-1.5'>
					{sections.map((_, i) => (
						<div
							key={i}
							className={`h-2 rounded-full transition-all duration-300 ${
								i === step
									? 'w-6 bg-blue-600'
									: i < step
										? 'w-2 bg-blue-400'
										: 'w-2 bg-zinc-300 dark:bg-zinc-600'
							}`}
						/>
					))}
				</div>

				{isLastStep ? (
					<Button
						variant='solid'
						color='emerald'
						onClick={onFinish}
						isLoading={isSubmitting}
						disabled={isSubmitting || sectionProps.readOnly}
						className='gap-2'>
						Finalizar Revisión
						<Icon icon='HeroCheck' className='h-4 w-4' />
					</Button>
				) : (
					<Button
						variant='solid'
						color='blue'
						onClick={handleNext}
						disabled={sectionProps.readOnly && false}
						className='gap-2'>
						Siguiente
						<Icon icon='HeroArrowRight' className='h-4 w-4' />
					</Button>
				)}
			</div>
		</div>
	);
}

export default FormShell;
