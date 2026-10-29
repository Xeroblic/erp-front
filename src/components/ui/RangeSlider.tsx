/**
 * RangeSlider.tsx
 * Componente de slider reutilizable para selección de valores numéricos.
 * Visualiza el valor actual y permite arrastrar para cambiar.
 */
import React, { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import Icon from '@/components/icon/Icon';
import type { TIcons } from '@/types/icons.type';

interface RangeSliderProps {
	value: number;
	onChange: (val: number) => void;
	min?: number;
	max?: number;
	step?: number;
	label?: string;
	unit?: string;
	className?: string;
	disabled?: boolean;
	icon?: TIcons;
	valueFormatter?: (val: number) => string;
	hideValueBadge?: boolean;
}

const clamp = (val: number, minValue: number, maxValue: number) =>
	Math.min(Math.max(val, minValue), maxValue);

const RangeSlider: React.FC<RangeSliderProps> = ({
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	label,
	unit = '',
	className = '',
	disabled = false,
	icon = 'HeroBolt',
	valueFormatter,
	hideValueBadge = false,
}) => {
	const progressRef = useRef<HTMLDivElement>(null);
	const thumbRef = useRef<HTMLDivElement>(null);
	const glowRef = useRef<HTMLDivElement>(null);
	const clampedProgress = useMemo(() => {
		if (max === min) return 0;
		const rawProgress = ((value - min) / (max - min)) * 100;
		return clamp(rawProgress, 0, 100);
	}, [value, min, max]);

	const energyLabel = useMemo(() => {
		if (disabled) return 'Sin energía';
		if (clampedProgress < 20) return 'Carga crítica';
		if (clampedProgress < 60) return 'Carga media';
		if (clampedProgress < 85) return 'Carga saludable';
		return 'Carga óptima';
	}, [clampedProgress, disabled]);

	const getTrackPalette = () => {
		if (disabled) {
			return {
				fill: '#a1a1aa',
				glow: 'rgba(161, 161, 170, 0.25)',
				thumb: '#e4e4e7',
			};
		}
		if (clampedProgress < 20) {
			return { fill: '#f97316', glow: 'rgba(249, 115, 22, 0.35)', thumb: '#fdba74' };
		}
		if (clampedProgress < 60) {
			return { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', thumb: '#bfdbfe' };
		}
		if (clampedProgress < 85) {
			return { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', thumb: '#6ee7b7' };
		}
		return { fill: '#22d3ee', glow: 'rgba(34, 211, 238, 0.35)', thumb: '#a5f3fc' };
	};

	useEffect(() => {
		if (!progressRef.current || !thumbRef.current || !glowRef.current) {
			return;
		}
		const { fill, glow, thumb } = getTrackPalette();

		gsap.to(progressRef.current, {
			width: `${clampedProgress}%`,
			backgroundColor: fill,
			duration: 0.35,
			ease: 'power2.out',
		});

		gsap.to(thumbRef.current, {
			left: `${clampedProgress}%`,
			backgroundColor: thumb,
			duration: 0.35,
			ease: 'power2.out',
		});

		gsap.to(glowRef.current, {
			left: `${clampedProgress}%`,
			opacity: disabled ? 0 : 0.6,
			backgroundColor: glow,
			scale: disabled ? 0.85 : 1,
			duration: 0.35,
			ease: 'power2.out',
		});
	}, [clampedProgress, disabled]);

	const formattedValue = useMemo(
		() => (valueFormatter ? valueFormatter(value) : value),
		[value, valueFormatter],
	);

	return (
		<div
			className={`w-full select-none space-y-3 ${className} ${disabled ? 'opacity-60' : ''}`}>
			{label && (
				<div className='flex items-center justify-between gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
					<div className='flex items-center gap-2 text-xs uppercase tracking-wide'>
						{icon && (
							<span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/10 text-rose-500 dark:bg-zinc-100/5 dark:text-rose-300'>
								<Icon icon={icon} className='h-3.5 w-3.5' />
							</span>
						)}
						<span className='text-zinc-500 dark:text-zinc-400'>{label}</span>
					</div>
					{!hideValueBadge && (
						<span className='inline-flex items-center gap-1 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-emerald-400/10 dark:border-zinc-700'>
							{formattedValue}
							{unit && (
								<span className='text-[10px] font-semibold text-zinc-300'>
									{unit}
								</span>
							)}
						</span>
					)}
				</div>
			)}

			<div className='relative flex h-12 flex-col justify-center' aria-hidden='true'>
				{/* Track Background */}
				<div className='absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700'>
					{/* Progress Bar */}
					<div ref={progressRef} className='h-full rounded-full' style={{ width: 0 }} />
				</div>

				{/* Native Input Range (Invisible but Functional) */}
				<input
					type='range'
					min={min}
					max={max}
					step={step}
					value={value || 0}
					onChange={(e) => onChange(Number(e.target.value))}
					disabled={disabled}
					className='absolute inset-x-0 top-0 z-20 h-full w-full cursor-pointer opacity-0'
					aria-label={label || 'Control deslizante'}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={value}
					aria-disabled={disabled}
				/>

				{/* Custom Thumb Handle (Visual) */}
				<div
					ref={thumbRef}
					className='pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ring-1 ring-black/10 transition-all duration-100 dark:border-zinc-900'
					style={{ left: '0%' }}
				/>

				{/* Glow Accent */}
				<div
					ref={glowRef}
					className='pointer-events-none absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-md'
				/>
			</div>

			<div className='flex items-center justify-between px-1 text-xs text-zinc-400'>
				<span>
					{min}
					{unit}
				</span>
				<span className='text-[11px] font-semibold text-zinc-500 dark:text-zinc-300'>
					{energyLabel}
				</span>
				<span>
					{max}
					{unit}
				</span>
			</div>
		</div>
	);
};

export default RangeSlider;
