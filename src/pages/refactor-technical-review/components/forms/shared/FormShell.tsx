import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import type { FormikValues } from 'formik';
import { toast } from 'react-toastify';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type { SectionConfig, FormSectionProps } from './types';

/**
 * Desplazamiento de la sección según la dirección de navegación (1 avanza, -1
 * retrocede). Son funciones porque la sección que sale ya no se vuelve a
 * renderizar: `AnimatePresence` le pasa por `custom` la dirección del cambio
 * actual. Con un `exit` fijo conservaría la dirección con que entró y saldría
 * hacia el lado contrario.
 */
const sectionVariants: Variants = {
	enter: (direction: number) => ({ opacity: 0, x: direction * 40 }),
	center: { opacity: 1, x: 0 },
	exit: (direction: number) => ({ opacity: 0, x: direction * -40 }),
};

interface FormShellProps<T extends FormikValues> {
	sections: SectionConfig<T>[];
	sectionProps: FormSectionProps<T>;
	onBack: () => void;
	onFinish: () => void | Promise<void>;
	isSubmitting?: boolean;
	/** Called when user navigates between sections (before transition) */
	onStepChange?: (direction: 'next' | 'prev') => void;
	/** Validate current step before moving forward */
	onValidateStep?: (sectionKey: string) => Promise<{ isValid: boolean; message?: string }>;
	/**
	 * Guarda el borrador de la sección actual. ZF-102: el autoguardado por navegación sólo
	 * corría al cambiar de sección, así que una sección trabada por la validación se perdía
	 * entera. Se llama también cuando el avance queda bloqueado.
	 */
	onPersistDraft?: () => Promise<void> | void;
	/** Whether auto-save is in progress */
	isSaving?: boolean;
	/** Initial section key to jump to on first mount (e.g. 'gallery' shortcut) */
	initialSectionKey?: string;
	/** Solicitud de mostrar una sección con errores sin desmontar el formulario. */
	sectionRequest?: { key: string; token: number };
}

interface IStepToneClasses {
	active: string;
	completed: string;
	idle: string;
}

/** Clase del paso según esté activo, ya completado o pendiente. */
const stepTone = (isActive: boolean, isCompleted: boolean, classes: IStepToneClasses): string => {
	if (isActive) return classes.active;
	if (isCompleted) return classes.completed;
	return classes.idle;
};

const FormShell = <T extends FormikValues>({
	sections,
	sectionProps,
	onBack,
	onFinish,
	isSubmitting = false,
	onStepChange,
	onValidateStep,
	onPersistDraft,
	isSaving = false,
	initialSectionKey,
	sectionRequest,
}: FormShellProps<T>) => {
	const [step, setStep] = useState(0);
	const [direction, setDirection] = useState(1);

	const MAX_STEPS = sections.length;

	useEffect(() => {
		if (!sectionRequest) return;
		const index = sections.findIndex((section) => section.key === sectionRequest.key);
		if (index >= 0) setStep(index);
	}, [sectionRequest, sections]);

	// Scroll to top on step change
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [step]);

	// Jump to initial section on first mount (e.g. gallery shortcut)
	useEffect(() => {
		if (initialSectionKey) {
			const index = sections.findIndex((s) => s.key === initialSectionKey);
			if (index >= 0) {
				setStep(index);
			}
		}
		// Only run when initialSectionKey prop first arrives
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialSectionKey]);

	const handleNext = async () => {
		if (onValidateStep && !sectionProps.readOnly) {
			const validation = await onValidateStep(sections[step].key);
			if (!validation.isValid) {
				// El aviso primero: esperar al guardado antes de pintarlo devolvería el
				// botón mudo que ZF-102 vino a corregir cuando la red va lenta.
				toast.error(
					validation.message || 'Completa los campos obligatorios antes de continuar.',
				);
				await onPersistDraft?.();
				return;
			}
		}

		if (step < MAX_STEPS - 1) {
			onStepChange?.('next');
			setDirection(1);
			setStep((s) => s + 1);
		}
	};

	const handlePrev = () => {
		if (step > 0) {
			onStepChange?.('prev');
			setDirection(-1);
			setStep((s) => s - 1);
		} else {
			onBack();
		}
	};

	const handleStepClick = async (index: number) => {
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
			if (onValidateStep && !sectionProps.readOnly) {
				const validation = await onValidateStep(sections[step].key);
				if (!validation.isValid) {
					toast.error(
						validation.message ||
							'Completa los campos obligatorios antes de continuar.',
					);
					await onPersistDraft?.();
					return;
				}
			}
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
			<div className='overflow-x-auto rounded-t-2xl border border-zinc-200 bg-linear-to-r from-blue-50/80 via-white to-blue-50/80 dark:border-zinc-700 dark:from-zinc-800/80 dark:via-zinc-900 dark:to-zinc-800/80'>
				<div className='flex items-center justify-between px-4 py-3'>
					{isSaving && (
						<div className='mr-2 flex animate-pulse items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'>
							<div className='h-1.5 w-1.5 rounded-full bg-amber-500' />
							Guardando...
						</div>
					)}
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
										className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${stepTone(
											isActive,
											isCompleted,
											{
												active: 'bg-blue-600 text-white shadow-lg ring-4 shadow-blue-500/30 ring-blue-100 dark:ring-blue-900/50',
												completed: 'bg-blue-500 text-white',
												idle: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500',
											},
										)}`}>
										{isCompleted && !isActive ? (
											<Icon
												icon='HeroCheck'
												className='h-6 w-6 text-white!'
											/>
										) : (
											<Icon
												icon={section.icon}
												className={`h-6 w-6 ${isActive ? 'text-white!' : ''}`}
											/>
										)}
									</div>

									{/* Label */}
									<span
										className={`text-[10px] font-semibold whitespace-nowrap transition-colors ${stepTone(
											isActive,
											isCompleted,
											{
												active: 'text-blue-700 dark:text-blue-300',
												completed: 'text-blue-500 dark:text-blue-400',
												idle: 'text-zinc-400 dark:text-zinc-500',
											},
										)}`}>
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
						variants={sectionVariants}
						initial='enter'
						animate='center'
						exit='exit'
						transition={{ duration: 0.25, ease: 'easeInOut' }}
						className='p-6'>
						<h3 className='mb-6 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100'>
							<Icon icon={currentSection.icon} className='h-5 w-5 text-blue-600' />
							{currentSection.label}
						</h3>
						<SectionComponent
							values={sectionProps.values}
							errors={sectionProps.errors}
							readOnly={sectionProps.readOnly}
							setFieldValue={sectionProps.setFieldValue}
							onFieldBlur={sectionProps.onFieldBlur}
							onDirectSubmit={sectionProps.onDirectSubmit}
							schemaFields={sectionProps.schemaFields}
						/>
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
					{sections.map((section, i) => (
						<div
							key={section.key}
							className={`h-2 rounded-full transition-all duration-300 ${stepTone(
								i === step,
								i < step,
								{
									active: 'w-6 bg-blue-600',
									completed: 'w-2 bg-blue-400',
									idle: 'w-2 bg-zinc-300 dark:bg-zinc-600',
								},
							)}`}
						/>
					))}
				</div>

				{isLastStep ? (
					<Button
						variant='solid'
						color='emerald'
						onClick={() => {
							void onFinish();
						}}
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
};

export default FormShell;
