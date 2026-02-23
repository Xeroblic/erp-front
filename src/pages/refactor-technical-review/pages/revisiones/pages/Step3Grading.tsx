import React, { useCallback, useEffect, useRef, useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import gsap from 'gsap';

/* ═══════════════════════════ Types ═══════════════════════════ */

interface Step3GradingProps {
	suggestedGrade: string | null;
	confidence: number;
	breakdown: Record<string, unknown>;
	serialNumber: string;
	equipmentType: string;
	reviewStatus: string;
	isApproved: boolean;
	approving: boolean;
	onBack: () => void;
	onComplete: () => void;
	onApprove: (
		grade: string,
		overrideSuggestion?: boolean,
		overrideReason?: string,
	) => Promise<void>;
	onRecalculate: () => Promise<void>;
	onModifyReview: () => Promise<void>;
}

interface GradeStyle {
	label: string;
	description: string;
	statusText: string;
	color: string;
	badgeColor: string;
	gradient: string;
	ringStart: string;
	ringEnd: string;
	glowColor: string;
	orbBg: string;
}

/* ═══════════════════════════ Constants ═══════════════════════════ */

const RING_RADIUS = 120;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SVG_CENTER = 140;
const SVG_SIZE = 280;

const GRADE_CONFIG: Record<string, GradeStyle> = {
	A: {
		label: 'Grado A',
		description: 'Excelente condición. Como nuevo.',
		statusText: 'Excelente Condición',
		color: 'text-emerald-600 dark:text-emerald-400',
		badgeColor: 'bg-emerald-500 text-white',
		gradient: 'from-emerald-400 to-emerald-600',
		ringStart: '#10b981',
		ringEnd: '#34d399',
		glowColor: 'rgba(16, 185, 129, 0.35)',
		orbBg: 'bg-emerald-500',
	},
	B: {
		label: 'Grado B',
		description: 'Buena condición. Desgaste mínimo.',
		statusText: 'Buena Condición',
		color: 'text-blue-600 dark:text-blue-400',
		badgeColor: 'bg-blue-500 text-white',
		gradient: 'from-blue-400 to-blue-600',
		ringStart: '#3b82f6',
		ringEnd: '#60a5fa',
		glowColor: 'rgba(59, 130, 246, 0.35)',
		orbBg: 'bg-blue-500',
	},
	C: {
		label: 'Grado C',
		description: 'Condición aceptable. Desgaste visible.',
		statusText: 'Condición Aceptable',
		color: 'text-amber-600 dark:text-amber-400',
		badgeColor: 'bg-amber-500 text-white',
		gradient: 'from-amber-400 to-amber-600',
		ringStart: '#f59e0b',
		ringEnd: '#fbbf24',
		glowColor: 'rgba(245, 158, 11, 0.35)',
		orbBg: 'bg-amber-500',
	},
	M: {
		label: 'Grado M',
		description: 'Condición deficiente. Requiere reparación.',
		statusText: 'Requiere Reparación',
		color: 'text-red-600 dark:text-red-400',
		badgeColor: 'bg-red-500 text-white',
		gradient: 'from-red-400 to-red-600',
		ringStart: '#ef4444',
		ringEnd: '#f87171',
		glowColor: 'rgba(239, 68, 68, 0.35)',
		orbBg: 'bg-red-500',
	},
};

const GRADE_OPTIONS: TSelectOption[] = [
	{ value: 'A', label: 'Grado A — Excelente' },
	{ value: 'B', label: 'Grado B — Muy Bueno' },
	{ value: 'C', label: 'Grado C — Bueno' },
	{ value: 'M', label: 'Grado M — Malo' },
];

/* ═══════════════════════════ Helpers ═══════════════════════════ */

const formatBreakdownValue = (value: unknown): string => {
	if (typeof value === 'number') {
		return Number.isInteger(value) ? String(value) : value.toFixed(1);
	}
	if (typeof value === 'boolean') return value ? 'Sí' : 'No';
	if (typeof value === 'object' && value !== null) {
		const obj = value as Record<string, unknown>;
		if (typeof obj.label === 'string') return obj.label;
		if (typeof obj.value === 'string') return obj.value;
		return JSON.stringify(value);
	}
	return String(value ?? '-');
};

/** Extrae un string seguro de un valor que puede ser string, objeto {value,label}, u otro */
const extractStringValue = (val: unknown, fallback: string): string => {
	if (typeof val === 'string') return val;
	if (typeof val === 'object' && val !== null) {
		const obj = val as Record<string, unknown>;
		if (typeof obj.value === 'string') return obj.value;
		if (typeof obj.label === 'string') return obj.label;
	}
	return fallback;
};

/* ═══════════════════════════ Component ═══════════════════════════ */

const Step3Grading: React.FC<Step3GradingProps> = ({
	suggestedGrade,
	confidence,
	breakdown,
	serialNumber,
	equipmentType,
	// reviewStatus — reserved for future use
	isApproved,
	approving,
	// onBack — reserved for future use
	onComplete,
	onApprove,
	onRecalculate,
	onModifyReview,
}) => {
	/* ── State ── */
	const [isApproving, setIsApproving] = useState(false);
	const [isRecalculating, setIsRecalculating] = useState(false);
	const [isReopening, setIsReopening] = useState(false);
	const [showManualOverride, setShowManualOverride] = useState(false);
	const [manualGrade, setManualGrade] = useState<string | null>(null);
	const [overrideReason, setOverrideReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	/* ── Derived ── */
	const grade = extractStringValue(suggestedGrade, 'M').toUpperCase();
	const gradeConfig = GRADE_CONFIG[grade] || GRADE_CONFIG['M'];
	const confidencePercent = Math.round(confidence || 0);
	const displayEquipmentType = extractStringValue(equipmentType, '');
	const ringOffset = RING_CIRCUMFERENCE * (1 - confidencePercent / 100);
	const gradientId = `ring-grad-${grade}`;

	/* ── Handlers ── */
	const handleAcceptSuggestion = useCallback(async () => {
		setIsApproving(true);
		setError(null);
		try {
			await onApprove(grade, false);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Error al aprobar la revisión';
			setError(msg);
		} finally {
			setIsApproving(false);
		}
	}, [grade, onApprove]);

	const handleManualApprove = useCallback(async () => {
		if (!manualGrade) {
			setError('Debes seleccionar un grado');
			return;
		}
		if (!overrideReason.trim()) {
			setError('Debes proporcionar una razón para modificar el grado sugerido');
			return;
		}
		setIsApproving(true);
		setError(null);
		try {
			await onApprove(manualGrade, true, overrideReason);
		} catch (e: unknown) {
			const msg =
				e instanceof Error ? e.message : 'Error al aprobar con grado manual';
			setError(msg);
		} finally {
			setIsApproving(false);
		}
	}, [manualGrade, overrideReason, onApprove]);

	const handleRecalculate = useCallback(async () => {
		setIsRecalculating(true);
		setError(null);
		try {
			await onRecalculate();
		} catch (e: unknown) {
			const msg =
				e instanceof Error ? e.message : 'Error al recalcular el grado';
			setError(msg);
		} finally {
			setIsRecalculating(false);
		}
	}, [onRecalculate]);

	const handleReopen = useCallback(async () => {
		setIsReopening(true);
		setError(null);
		try {
			await onModifyReview();
		} catch (e: unknown) {
			const msg =
				e instanceof Error ? e.message : 'Error al reabrir la revisión';
			setError(msg);
		} finally {
			setIsReopening(false);
		}
	}, [onModifyReview]);

	/* ── GSAP Refs ── */
	const scopeRef = useRef<HTMLDivElement>(null);
	const ringContainerRef = useRef<HTMLDivElement>(null);
	const ringCircleRef = useRef<SVGCircleElement>(null);
	const gradeLetterRef = useRef<HTMLSpanElement>(null);
	const confidenceNumRef = useRef<HTMLSpanElement>(null);
	const leftCardRef = useRef<HTMLDivElement>(null);
	const rightCardRef = useRef<HTMLDivElement>(null);
	const statusBadgeRef = useRef<HTMLDivElement>(null);
	const glowRef = useRef<HTMLDivElement>(null);

	/* ── GSAP Master Animation ── */
	useEffect(() => {
		const ctx = gsap.context(() => {
			const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

			// 1. Main container fade-in with spring
			tl.from(scopeRef.current, {
				opacity: 0,
				y: 30,
				duration: 0.6,
				ease: 'back.out(1.2)',
			});

			// 2. Ring container scale-in
			if (ringContainerRef.current) {
				tl.from(
					ringContainerRef.current,
					{ scale: 0.6, opacity: 0, duration: 0.7, ease: 'back.out(1.7)' },
					'-=0.3',
				);
			}

			// 3. Grade letter — elastic pop
			if (gradeLetterRef.current) {
				tl.from(
					gradeLetterRef.current,
					{
						scale: 0,
						rotation: -20,
						duration: 0.9,
						ease: 'elastic.out(1, 0.35)',
					},
					'-=0.4',
				);
			}

			// 4. SVG ring stroke draw
			if (ringCircleRef.current) {
				tl.fromTo(
					ringCircleRef.current,
					{ attr: { 'stroke-dashoffset': RING_CIRCUMFERENCE } },
					{
						attr: { 'stroke-dashoffset': ringOffset },
						duration: 1.4,
						ease: 'power3.out',
					},
					'-=0.6',
				);
			}

			// 5. Confidence counter
			if (confidenceNumRef.current) {
				const proxy = { val: 0 };
				const numEl = confidenceNumRef.current;
				tl.to(
					proxy,
					{
						val: confidencePercent,
						duration: 1.2,
						ease: 'power2.out',
						onUpdate: () => {
							numEl.textContent = `${Math.round(proxy.val)}%`;
						},
					},
					'-=1.2',
				);
			}

			// 6. Side cards slide in from opposite sides
			const cards = [leftCardRef.current, rightCardRef.current].filter(Boolean);
			if (cards.length) {
				tl.from(
					cards,
					{
						x: (i: number) => (i === 0 ? -40 : 40),
						opacity: 0,
						duration: 0.6,
						stagger: 0.15,
					},
					'-=0.8',
				);
			}

			// 7. Status badge float-up
			if (statusBadgeRef.current) {
				tl.from(
					statusBadgeRef.current,
					{ y: 15, opacity: 0, duration: 0.4 },
					'-=0.3',
				);
			}

			// 8. Glow breathing loop
			if (glowRef.current) {
				gsap.to(glowRef.current, {
					opacity: 0.6,
					scale: 1.1,
					duration: 2,
					repeat: -1,
					yoyo: true,
					ease: 'sine.inOut',
				});
			}
		}, scopeRef);

		return () => ctx.revert();
	}, [grade, confidencePercent, ringOffset]);

	/* ── Derived (breakdown) ── */
	const breakdownEntries = breakdown ? Object.entries(breakdown) : [];
	const hasBreakdown = breakdownEntries.length > 0;

	/* ═══════════════════════════ Render ═══════════════════════════ */

	return (
		<div ref={scopeRef} className='space-y-6'>
			{/* ═══ Error Banner ═══ */}
			{error && (
				<div className='flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-950/40 dark:backdrop-blur-sm'>
					<Icon
						icon='HeroExclamationCircle'
						className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-500'
					/>
					<div>
						<h4 className='text-sm font-semibold text-red-900 dark:text-red-100'>
							Error
						</h4>
						<p className='mt-1 text-sm text-red-700 dark:text-red-300'>
							{error}
						</p>
					</div>
				</div>
			)}

			{/* ═══ Main Glass Container ═══ */}
			<div className='relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl dark:border-white/[0.08] dark:bg-zinc-900/60 dark:shadow-2xl dark:backdrop-blur-xl'>
				{/* Background Glow Orbs */}
				<div className='pointer-events-none absolute inset-0 overflow-hidden'>
					<div
						className={`absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-[0.07] blur-[100px] dark:opacity-[0.12] ${gradeConfig.orbBg}`}
					/>
					<div
						className={`absolute -bottom-20 -right-20 h-80 w-80 rounded-full opacity-[0.05] blur-[100px] dark:opacity-[0.10] ${gradeConfig.orbBg}`}
					/>
					<div className='absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 opacity-[0.03] blur-[120px] dark:opacity-[0.06]' />
				</div>

				<div className='relative z-10 space-y-8 p-6 md:p-8'>
					{/* ── Step Header ── */}
					<div className='flex items-start justify-between'>
						<div>
							<h2 className='flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white'>
								<Icon
									icon='HeroCheckBadge'
									className={`h-5 w-5 ${gradeConfig.color}`}
								/>
								Paso 3: Calificación
							</h2>
							<p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
								{isApproved
									? 'Esta revisión ya fue aprobada. Solo lectura.'
									: 'Revisa el grado sugerido y aprueba el equipo'}
							</p>
						</div>
						{isApproved && (
							<Badge
								variant='solid'
								color='emerald'
								className='gap-1 rounded-full px-3'>
								<Icon icon='HeroCheckBadge' className='text-xl font-extrabold text-white' />
								Aprobado
							</Badge>
						)}
					</div>

					{/* ── Read-only Banner ── */}
					{isApproved && (
						<div className='flex flex-col gap-4 rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-500/20 dark:from-blue-900/20 dark:to-indigo-900/20 sm:flex-row sm:items-center sm:justify-between'>
							<div className='flex items-center gap-3'>
								<div className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20'>
									<Icon
										icon='HeroEye'
										className='h-5 w-5 text-blue-500 dark:text-blue-400'
									/>
								</div>
								<div>
									<p className='text-sm font-semibold text-blue-800 dark:text-blue-200'>
										Modo Solo Lectura
									</p>
									<p className='text-xs text-blue-600 dark:text-blue-400'>
										Revisión aprobada. Los cambios están restringidos.
									</p>
								</div>
							</div>
							<Button
								variant='solid'
								color='blue'
								onClick={handleReopen}
								isLoading={isReopening}
								disabled={isReopening}
								className='flex-shrink-0'>
								<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4 text-white font-bold' />
								Reabrir
							</Button>
						</div>
					)}

					{/* ═══════════ HERO SECTION ═══════════ */}
					<div className='flex flex-col items-center justify-center gap-6 py-2 md:flex-row md:gap-10 lg:gap-12'>
						{/* ── Left Info Card ── */}
						<div
							ref={leftCardRef}
							className='order-2 w-full rounded-2xl border border-zinc-200/60 bg-zinc-50/80 p-5 backdrop-blur-sm transition-colors hover:bg-zinc-100/80 dark:border-white/[0.08] dark:bg-zinc-800/40 dark:hover:bg-zinc-800/60 md:order-1 md:w-60'>
							<div className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-200/60 dark:bg-zinc-700/50'>
								<Icon
									icon='HeroSparkles'
									className='h-5 w-5 text-zinc-600 dark:text-zinc-300'
								/>
							</div>
							<div className='space-y-4'>
								<div>
									<p className='text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500'>
										Número de Serie
									</p>
									<p className='mt-1 font-mono text-lg font-bold tracking-tight text-zinc-900 dark:text-white'>
										{serialNumber}
									</p>
								</div>
								<div className='h-px w-full bg-zinc-200/80 dark:bg-zinc-700/50' />
								<div>
									<p className='text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500'>
										Tipo de Equipo
									</p>
									<p className='mt-1 text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300'>
										{displayEquipmentType}
									</p>
								</div>
							</div>
						</div>

						{/* ── Center: SVG Ring ── */}
						<div
							ref={ringContainerRef}
							className='order-1 flex flex-col items-center md:order-2'>
							<div className='relative h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72'>
								{/* Glow behind ring */}
								<div
									ref={glowRef}
									className='absolute inset-4 rounded-full opacity-30 blur-[50px] dark:opacity-40'
									style={{ backgroundColor: gradeConfig.glowColor }}
								/>

								{/* SVG Ring */}
								<svg
									viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
									className='relative h-full w-full -rotate-90'
									style={{
										filter: `drop-shadow(0 0 10px ${gradeConfig.glowColor})`,
									}}>
									<defs>
										<linearGradient
											id={gradientId}
											x1='0%'
											y1='0%'
											x2='100%'
											y2='0%'>
											<stop
												offset='0%'
												stopColor={gradeConfig.ringStart}
											/>
											<stop
												offset='100%'
												stopColor={gradeConfig.ringEnd}
											/>
										</linearGradient>
									</defs>
									{/* Track */}
									<circle
										cx={SVG_CENTER}
										cy={SVG_CENTER}
										r={RING_RADIUS}
										fill='transparent'
										className='stroke-zinc-200 dark:stroke-zinc-800'
										strokeWidth='10'
									/>
									{/* Progress */}
									<circle
										ref={ringCircleRef}
										cx={SVG_CENTER}
										cy={SVG_CENTER}
										r={RING_RADIUS}
										fill='transparent'
										stroke={`url(#${gradientId})`}
										strokeWidth='10'
										strokeLinecap='round'
										strokeDasharray={RING_CIRCUMFERENCE}
										strokeDashoffset={RING_CIRCUMFERENCE}
									/>
								</svg>

								{/* Inner circle content */}
								<div className='absolute inset-5 flex flex-col items-center justify-center rounded-full border border-zinc-200/60 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70 dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.03)]'>
									<span
										className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${gradeConfig.color}`}>
										Grado Final
									</span>
									<span
										ref={gradeLetterRef}
										className='bg-gradient-to-b from-zinc-800 to-zinc-500 bg-clip-text text-7xl font-black text-transparent drop-shadow-sm dark:from-white dark:to-zinc-400 sm:text-8xl'>
										{grade}
									</span>
									<div className='mt-2 flex flex-col items-center'>
										<span className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>
											Confianza
										</span>
										<span
											ref={confidenceNumRef}
											className={`text-xl font-bold sm:text-2xl ${gradeConfig.color}`}>
											0%
										</span>
									</div>
								</div>
							</div>

							{/* Status badge */}
							<div ref={statusBadgeRef} className='mt-6'>
								<span className='inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-5 py-2 text-sm font-bold text-zinc-700 dark:border-white/10 dark:bg-zinc-800/50 dark:text-zinc-300'>
									<span
										className='h-2 w-2 animate-pulse rounded-full'
										style={{
											backgroundColor: gradeConfig.ringStart,
											boxShadow: `0 0 8px ${gradeConfig.ringStart}`,
										}}
									/>
									{gradeConfig.statusText}
								</span>
							</div>
						</div>

						{/* ── Right Info Card ── */}
						<div
							ref={rightCardRef}
							className='order-3 w-full rounded-2xl border border-zinc-200/60 bg-zinc-50/80 p-5 backdrop-blur-sm transition-colors hover:bg-zinc-100/80 dark:border-white/[0.08] dark:bg-zinc-800/40 dark:hover:bg-zinc-800/60 md:w-60'>
							<div className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-200/60 dark:bg-zinc-700/50'>
								<Icon
									icon='HeroStar'
									className='h-5 w-5 text-zinc-600 dark:text-zinc-300'
								/>
							</div>
							<div className='space-y-4'>
								<div>
									<p className='text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500'>
										Grado Sugerido
									</p>
									<div className='mt-1 flex items-center gap-2'>
										<span
											className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-black text-white ${gradeConfig.gradient}`}>
											{grade}
										</span>
										<span className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
											{gradeConfig.label}
										</span>
									</div>
								</div>
								<div className='h-px w-full bg-zinc-200/80 dark:bg-zinc-700/50' />
								<div>
									<p className='text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500'>
										Descripción
									</p>
									<p className='mt-1 text-sm text-zinc-600 dark:text-zinc-400'>
										{gradeConfig.description}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* ═══ Breakdown ═══ */}
					{hasBreakdown && (
						<div className='rounded-xl border border-zinc-200/60 bg-zinc-50/50 p-5 dark:border-white/[0.06] dark:bg-zinc-800/30'>
							<h4 className='mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
								<Icon
									icon='HeroBolt'
									className='h-4 w-4 text-zinc-400'
								/>
								Desglose de Puntuación
							</h4>
							<div className='grid gap-2 sm:grid-cols-2'>
								{breakdownEntries.map(([key, val]) => (
									<div
										key={key}
										className='flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-zinc-800/40'>
										<span className='text-sm capitalize text-zinc-500 dark:text-zinc-400'>
											{key.replace(/_/g, ' ')}
										</span>
										<span className='text-sm font-semibold text-zinc-800 dark:text-zinc-200'>
											{formatBreakdownValue(val)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* ═══ Action Cards (only when NOT approved) ═══ */}
					{!isApproved && (
						<div className='space-y-4'>
							{/* Recalculate */}
							<div className='flex flex-col gap-4 rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 dark:border-blue-500/15 dark:from-blue-900/15 dark:to-indigo-900/10 sm:flex-row sm:items-center sm:justify-between'>
								<div>
									<h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100'>
										¿Modificaste los detalles técnicos?
									</h4>
									<p className='mt-1 text-xs text-blue-700 dark:text-blue-300'>
										Si cambiaste información importante, puedes
										recalcular el grado automáticamente.
									</p>
								</div>
								<Button
									variant='outline'
									color='blue'
									onClick={handleRecalculate}
									isLoading={isRecalculating}
									disabled={isRecalculating || isApproving}
									className='flex-shrink-0'>
									<Icon icon='HeroArrowPath' className='mr-2 h-4 w-4' />
									{isRecalculating
										? 'Recalculando...'
										: 'Recalcular'}
								</Button>
							</div>

							{/* Manual Override Toggle */}
							{!showManualOverride && (
								<div className='flex flex-col gap-4 rounded-xl border border-zinc-200/60 bg-zinc-50/80 p-4 dark:border-white/[0.06] dark:bg-zinc-800/30 sm:flex-row sm:items-center sm:justify-between'>
									<div className='flex gap-3'>
										<Icon
											icon='HeroInformationCircle'
											className='mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-400'
										/>
										<div>
											<h4 className='text-sm font-semibold text-zinc-700 dark:text-zinc-300'>
												¿No estás de acuerdo con la
												calificación?
											</h4>
											<p className='mt-1 text-xs text-zinc-500'>
												Puedes modificar el grado manualmente
												proporcionando una justificación.
											</p>
										</div>
									</div>
									<Button
										variant='outline'
										onClick={() => setShowManualOverride(true)}
										className='flex-shrink-0'>
										Modificar Grado
									</Button>
								</div>
							)}

							{/* Manual Override Form */}
							{showManualOverride && (
								<Card>
									<CardHeader>
										<div className='flex items-center justify-between'>
											<h3 className='text-base font-semibold text-zinc-900 dark:text-zinc-100'>
												Modificar Grado Manualmente
											</h3>
											<Button
												variant='outline'
												onClick={() => {
													setShowManualOverride(false);
													setManualGrade(null);
													setOverrideReason('');
													setError(null);
												}}>
												Cancelar
											</Button>
										</div>
									</CardHeader>
									<CardBody className='space-y-4'>
										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Nuevo Grado{' '}
												<span className='text-red-500'>*</span>
											</label>
											<SelectReact
												name='manual_grade'
												options={GRADE_OPTIONS}
												value={
													manualGrade
														? GRADE_OPTIONS.find(
																(o) =>
																	o.value ===
																	manualGrade,
															) || null
														: null
												}
												onChange={(option) => {
													setManualGrade(
														(
															option as TSelectOption | null
														)?.value || null,
													);
													setError(null);
												}}
												placeholder='Seleccionar grado'
											/>
										</div>
										<div>
											<label className='mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
												Razón del Cambio{' '}
												<span className='text-red-500'>*</span>
											</label>
											<Textarea
												name='override_reason'
												value={overrideReason}
												onChange={(e) => {
													setOverrideReason(e.target.value);
													setError(null);
												}}
												rows={3}
												placeholder='Explica por qué el grado sugerido no es correcto...'
											/>
											<p className='mt-1 text-xs text-zinc-500'>
												Esta información quedará registrada en
												el historial.
											</p>
										</div>
									</CardBody>
								</Card>
							)}
						</div>
					)}

					{/* ═══ Footer Actions ═══ */}
					<div className='flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/60 pt-5 dark:border-white/[0.06]'>
						<div className='flex flex-wrap gap-2'>
							<Button
								variant='outline'
								onClick={onComplete}
								disabled={isApproving || isReopening}>
								<Icon icon='HeroArrowLeft' className='mr-2 h-4 w-4' />
								Volver al Lote
							</Button>
							{!isApproved && (
								<Button
									variant='outline'
									color='violet'
									onClick={handleReopen}
									isLoading={isReopening}
									disabled={isReopening || isApproving}
									title='Reabrir la revisión para modificar datos técnicos'>
									<Icon
										icon='HeroPencilSquare'
										className='mr-2 h-4 w-4'
									/>
									Modificar Revisión
								</Button>
							)}
						</div>
						{!isApproved && (
							<div className='flex gap-2'>
								{showManualOverride ? (
									<Button
										variant='solid'
										color='emerald'
										onClick={handleManualApprove}
										isLoading={isApproving || approving}
										disabled={
											isApproving ||
											approving ||
											!manualGrade ||
											!overrideReason.trim()
										}>
										<Icon
											icon='HeroCheck'
											className='mr-2 h-4 w-4'
										/>
										Aprobar con Grado Manual
									</Button>
								) : (
									<Button
										variant='solid'
										color='emerald'
										onClick={handleAcceptSuggestion}
										isLoading={isApproving || approving}
										disabled={
											isApproving ||
											approving ||
											isReopening
										}>
										<Icon
											icon='HeroCheckBadge'
											className='mr-2 h-4 w-4'
										/>
										Aceptar y Aprobar
									</Button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Step3Grading;
