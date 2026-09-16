import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import type { TIcons } from '@/types/icons.type';

export interface IWizardStepConfig {
	key: string;
	label: string;
	icon: TIcons;
	/** Frase corta bajo el título del paso. */
	hint?: string;
}

export interface IStepWizardProps {
	steps: readonly IWizardStepConfig[];
	step: number;
	direction: number;
	onStepClick: (index: number) => void;
	onPrev: () => void;
	onNext: () => void;
	/** Botones del último paso (confirmar, reintentar…). */
	finishActions: ReactNode;
	children: ReactNode;
}

/**
 * Asistente con el formato de `FormShell` de revisiones técnicas: barra de
 * pasos con íconos, un solo paso visible y pie con anterior / progreso /
 * siguiente. Es presentacional: la navegación vive en `useStepWizard`.
 */
const StepWizard: FC<IStepWizardProps> = ({
	steps,
	step,
	direction,
	onStepClick,
	onPrev,
	onNext,
	finishActions,
	children,
}) => {
	const current = steps[step];
	const isLastStep = step === steps.length - 1;

	return (
		<div className='flex flex-col'>
			<nav
				aria-label='Pasos'
				className='overflow-x-auto rounded-t-2xl border border-zinc-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 dark:border-zinc-700 dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-800/80'>
				<ol className='flex items-center justify-between px-4 py-3'>
					{steps.map((item, index) => {
						const isActive = index === step;
						const isCompleted = index < step;
						const isClickable = index < step || index === step + 1;

						return (
							<React.Fragment key={item.key}>
								<li>
									<button
										type='button'
										onClick={() => onStepClick(index)}
										disabled={!isClickable && !isActive}
										aria-current={isActive ? 'step' : undefined}
										className={classNames(
											'flex flex-col items-center gap-1.5 transition-all',
											isClickable || isActive
												? 'cursor-pointer'
												: 'cursor-default opacity-50',
										)}>
										<span
											className={classNames(
												'flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300',
												{
													'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100 dark:ring-blue-900/50':
														isActive,
													'bg-blue-500 text-white': isCompleted,
													'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500':
														!isActive && !isCompleted,
												},
											)}>
											<Icon
												icon={isCompleted ? 'HeroCheck' : item.icon}
												className={classNames('h-5 w-5', {
													'!text-white': isActive || isCompleted,
												})}
											/>
										</span>
										<span
											className={classNames(
												'whitespace-nowrap text-xs font-semibold transition-colors',
												{
													'text-blue-700 dark:text-blue-300': isActive,
													'text-blue-500 dark:text-blue-400': isCompleted,
													'text-zinc-400 dark:text-zinc-500':
														!isActive && !isCompleted,
												},
											)}>
											{item.label}
										</span>
									</button>
								</li>
								{index < steps.length - 1 && (
									<li aria-hidden='true' className='mx-2 mt-[-18px] flex-1'>
										<div
											className={classNames(
												'h-0.5 w-full rounded-full transition-colors',
												index < step
													? 'bg-blue-500'
													: 'bg-zinc-200 dark:bg-zinc-700',
											)}
										/>
									</li>
								)}
							</React.Fragment>
						);
					})}
				</ol>
			</nav>

			<div className='relative overflow-hidden rounded-b-2xl border border-t-0 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'>
				<AnimatePresence mode='wait' custom={direction} initial={false}>
					<motion.section
						key={step}
						custom={direction}
						initial={{ opacity: 0, x: direction * 40 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: direction * -40 }}
						transition={{ duration: 0.25, ease: 'easeInOut' }}
						aria-labelledby='wizard-step-title'
						className='p-6'>
						<header className='mb-6'>
							<h2
								id='wizard-step-title'
								className='flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100'>
								<Icon icon={current.icon} className='h-5 w-5 text-blue-600' />
								<span className='sr-only'>
									Paso {step + 1} de {steps.length}:{' '}
								</span>
								{current.label}
							</h2>
							{current.hint && (
								<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
									{current.hint}
								</p>
							)}
						</header>
						{children}
					</motion.section>
				</AnimatePresence>
			</div>

			<div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
				<Button
					type='button'
					variant='outline'
					icon='HeroArrowLeft'
					isDisable={step === 0}
					onClick={onPrev}>
					Anterior
				</Button>

				<div className='flex gap-1.5' aria-hidden='true'>
					{steps.map((item, index) => (
						<div
							key={item.key}
							className={classNames('h-2 rounded-full transition-all duration-300', {
								'w-6 bg-blue-600': index === step,
								'w-2 bg-blue-400': index < step,
								'w-2 bg-zinc-300 dark:bg-zinc-600': index > step,
							})}
						/>
					))}
				</div>

				{isLastStep ? (
					<div className='flex flex-wrap gap-3'>{finishActions}</div>
				) : (
					<Button
						type='button'
						variant='solid'
						color='blue'
						rightIcon='HeroArrowRight'
						onClick={onNext}>
						Siguiente
					</Button>
				)}
			</div>
		</div>
	);
};

export default StepWizard;
