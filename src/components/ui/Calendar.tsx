import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatDateInput, parseFormattedDate } from '@/utils/formatDateInput';

// ==========================================
// TYPES & INTERFACES
// ==========================================
export type TShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
export type TColors =
	| 'slate'
	| 'gray'
	| 'zinc'
	| 'neutral'
	| 'stone'
	| 'red'
	| 'orange'
	| 'amber'
	| 'yellow'
	| 'lime'
	| 'green'
	| 'emerald'
	| 'teal'
	| 'cyan'
	| 'sky'
	| 'blue'
	| 'indigo'
	| 'violet'
	| 'purple'
	| 'fuchsia'
	| 'pink'
	| 'rose'
	| 'primary';
export type TRounded =
	| 'rounded-none'
	| 'rounded-sm'
	| 'rounded'
	| 'rounded-md'
	| 'rounded-lg'
	| 'rounded-xl'
	| 'rounded-2xl'
	| 'rounded-3xl'
	| 'rounded-full';
export type TSize = 'sm' | 'md' | 'lg';

export interface CalendarOutputData {
	rawDates: Date[];
	localStrings: string[];
	isoStrings: string[];
	jsonPayload: string;
}

export interface CalendarProps {
	value?: Date | Date[];
	onChange?: (data: CalendarOutputData) => void;
	selectionMode?: 'single' | 'multiple' | 'range';
	variant?: 'base' | 'pro';
	size?: TSize;
	themeColor?: TColors;
	themeColorShade?: TShade;
	rounded?: TRounded;
	className?: string;
	isDark?: boolean;
	minDate?: Date;
	maxDate?: Date;
}

// ==========================================
// UTILS
// ==========================================
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
	const day = new Date(year, month, 1).getDay();
	return day === 0 ? 6 : day - 1; // Semana empieza en Lunes
};

const isSameDay = (d1?: Date | null, d2?: Date | null) => {
	if (!d1 || !d2) return false;
	return (
		d1.getDate() === d2.getDate() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getFullYear() === d2.getFullYear()
	);
};

const isDateBetween = (date: Date, start: Date, end: Date) => {
	const d = new Date(date).setHours(0, 0, 0, 0);
	const s = new Date(start).setHours(0, 0, 0, 0);
	const e = new Date(end).setHours(0, 0, 0, 0);
	return d > Math.min(s, e) && d < Math.max(s, e);
};

const formatDateLocal = (date?: Date | null) => {
	if (!date) return 'Selecciona fecha';
	return date.toLocaleDateString('es-ES', { month: 'short', day: '2-digit', year: 'numeric' });
};

const MONTH_NAMES = [
	'Ene',
	'Feb',
	'Mar',
	'Abr',
	'May',
	'Jun',
	'Jul',
	'Ago',
	'Sep',
	'Oct',
	'Nov',
	'Dic',
];
const MONTH_NAMES_FULL = [
	'Enero',
	'Febrero',
	'Marzo',
	'Abril',
	'Mayo',
	'Junio',
	'Julio',
	'Agosto',
	'Septiembre',
	'Octubre',
	'Noviembre',
	'Diciembre',
];
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const makeColorClass = (
	prefix: 'bg' | 'text' | 'border' | 'ring',
	color: string,
	shade: number | string,
) => {
	return `${prefix}-${color}-${shade}`;
};

// ==========================================
// COMPONENT
// ==========================================
type ViewMode = 'days' | 'months' | 'years';

const Calendar: React.FC<CalendarProps> = ({
	value,
	onChange,
	selectionMode = 'single',
	variant = 'base',
	size = 'md',
	themeColor = 'amber',
	themeColorShade = 500,
	rounded = 'rounded-2xl',
	className = '',
	minDate,
	maxDate,
}) => {
	const isPro = variant === 'pro';

	const sizeMap = {
		sm: {
			container: isPro ? 'max-w-[700px]' : 'max-w-[280px]',
			dayCell: 'h-7 w-7',
			text: 'text-xs',
			header: 'text-lg',
			padding: 'p-4',
		},
		md: {
			container: isPro ? 'max-w-[850px]' : 'max-w-[340px]',
			dayCell: 'h-9 w-9',
			text: 'text-sm',
			header: 'text-xl',
			padding: 'p-6',
		},
		lg: {
			container: isPro ? 'max-w-[1000px]' : 'max-w-[400px]',
			dayCell: 'h-11 w-11',
			text: 'text-base',
			header: 'text-2xl',
			padding: 'p-8',
		},
	};
	const s = sizeMap[size];

	const getInitialDates = () => {
		if (!value) return [];
		return Array.isArray(value) ? value : [value];
	};

	const [currentDate, setCurrentDate] = useState(getInitialDates()[0] || new Date());
	const [selectedDates, setSelectedDates] = useState<Date[]>(getInitialDates());
	const [hoverDate, setHoverDate] = useState<Date | null>(null);
	const [viewMode, setViewMode] = useState<ViewMode>('days');
	const [decadeStart, setDecadeStart] = useState<number>(
		currentDate.getFullYear() - (currentDate.getFullYear() % 10),
	);
	const [gsapReady, setGsapReady] = useState(false);

	// Drag-to-Select
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState<Date | null>(null);

	const [inputStart, setInputStart] = useState<string>('');
	const [inputEnd, setInputEnd] = useState<string>('');

	const viewContainerRef = useRef<HTMLDivElement>(null);
	const daysGridRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		if ((window as any).gsap) {
			setGsapReady(true);
			return;
		}
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
		script.async = true;
		script.onload = () => setGsapReady(true);
		document.body.appendChild(script);

		return () => {
			if (document.body.contains(script)) document.body.removeChild(script);
		};
	}, []);

	// Fin del arrastre a nivel global
	useEffect(() => {
		const handleMouseUp = () => {
			if (isDragging) {
				setIsDragging(false);
				setDragStart(null);
				emitChange(selectedDates);
			}
		};
		window.addEventListener('mouseup', handleMouseUp);
		return () => window.removeEventListener('mouseup', handleMouseUp);
	}, [isDragging, selectedDates]);

	useEffect(() => {
		if (value) {
			const normalized = Array.isArray(value) ? value : [value];
			setSelectedDates(normalized);
			if (normalized.length > 0) setCurrentDate(normalized[0]);
		}
	}, [value]);

	// Sync local inputs when selectedDates changes externally
	useEffect(() => {
		if (selectionMode === 'range') {
			if (selectedDates.length > 0) {
				const d1 = selectedDates[0];
				setInputStart(
					[
						String(d1.getDate()).padStart(2, '0'),
						String(d1.getMonth() + 1).padStart(2, '0'),
						d1.getFullYear(),
					].join('/'),
				);
			} else {
				setInputStart('');
			}

			if (selectedDates.length > 1) {
				const d2 = selectedDates[1];
				setInputEnd(
					[
						String(d2.getDate()).padStart(2, '0'),
						String(d2.getMonth() + 1).padStart(2, '0'),
						d2.getFullYear(),
					].join('/'),
				);
			} else {
				setInputEnd('');
			}
		}
	}, [selectedDates, selectionMode]);

	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	// ==========================================
	// LOGICA & GSAP ANIMATIONS
	// ==========================================

	const emitChange = useCallback(
		(dates: Date[]) => {
			if (!onChange) return;
			const sortedDates =
				selectionMode === 'range' && dates.length >= 2
					? [dates[0], dates[dates.length - 1]].sort((a, b) => a.getTime() - b.getTime())
					: dates;

			const localStrings = sortedDates.map((d) => d.toLocaleDateString('es-ES'));
			const isoStrings = sortedDates.map((d) => d.toISOString());

			onChange({
				rawDates: sortedDates,
				localStrings: localStrings,
				isoStrings: isoStrings,
				jsonPayload: JSON.stringify({ fechas: isoStrings }),
			});
		},
		[onChange, selectionMode],
	);

	const animateViewChange = (newView: ViewMode) => {
		const gsap = (window as any).gsap;
		if (gsapReady && gsap && viewContainerRef.current) {
			gsap.to(viewContainerRef.current, {
				scale: 0.95,
				opacity: 0,
				duration: 0.15,
				ease: 'power2.in',
				onComplete: () => {
					setViewMode(newView);
					gsap.fromTo(
						viewContainerRef.current,
						{ scale: 1.05, opacity: 0 },
						{ scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' },
					);
				},
			});
		} else {
			setViewMode(newView);
		}
	};

	const animateTransition = (offset: number, type: 'month' | 'decade') => {
		const gsap = (window as any).gsap;

		if (!viewContainerRef.current || !gsapReady || !gsap) {
			if (type === 'month') setCurrentDate(new Date(currentYear, currentMonth + offset, 1));
			if (type === 'decade') setDecadeStart((prev) => prev + offset * 10);
			return;
		}

		const slideOutX = offset > 0 ? -30 : 30;
		const slideInX = offset > 0 ? 30 : -30;

		gsap.to(viewContainerRef.current, {
			x: slideOutX,
			opacity: 0,
			duration: 0.2,
			ease: 'power2.in',
			onComplete: () => {
				if (type === 'month')
					setCurrentDate(new Date(currentYear, currentMonth + offset, 1));
				if (type === 'decade') setDecadeStart((prev) => prev + offset * 10);

				gsap.fromTo(
					viewContainerRef.current,
					{ x: slideInX, opacity: 0 },
					{ x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' },
				);
			},
		});
	};

	const handlePrev = () => {
		if (viewMode === 'days') animateTransition(-1, 'month');
		else if (viewMode === 'years') animateTransition(-1, 'decade');
		else setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
	};

	const handleNext = () => {
		if (viewMode === 'days') animateTransition(1, 'month');
		else if (viewMode === 'years') animateTransition(1, 'decade');
		else setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
	};

	const isValidDate = (date: Date) => {
		const d = new Date(date).setHours(0, 0, 0, 0);
		if (minDate && d < new Date(minDate).setHours(0, 0, 0, 0)) return false;
		if (maxDate && d > new Date(maxDate).setHours(0, 0, 0, 0)) return false;
		return true;
	};

	// --- INTERACCIONES DE DÍAS (Click & Drag) ---
	const handleDayMouseDown = (date: Date, e: React.MouseEvent<HTMLButtonElement>) => {
		if (!isValidDate(date)) return;

		const gsap = (window as any).gsap;
		if (gsapReady && gsap) {
			gsap.fromTo(
				e.currentTarget,
				{ scale: 0.7 },
				{ scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' },
			);
		}

		if (selectionMode === 'range') {
			// Click-click: si ya hay 1 fecha, esta es la segunda (fin del rango)
			if (selectedDates.length === 1 && !isSameDay(date, selectedDates[0])) {
				const newRange = [selectedDates[0], date].sort((a, b) => a.getTime() - b.getTime());
				setSelectedDates(newRange);
				setHoverDate(null);
				setIsDragging(false);
				setDragStart(null);
				emitChange(newRange);
			} else {
				// Primer click o re-click: iniciar nueva selección + habilitar drag
				setIsDragging(true);
				setDragStart(date);
				setSelectedDates([date]);
				setHoverDate(date);
			}
		} else if (selectionMode === 'multiple') {
			const existsIndex = selectedDates.findIndex((d) => isSameDay(d, date));
			const newDates = [...selectedDates];
			if (existsIndex >= 0) newDates.splice(existsIndex, 1);
			else newDates.push(date);
			setSelectedDates(newDates);
			emitChange(newDates);
		} else {
			setSelectedDates([date]);
			emitChange([date]);
		}
	};

	const handleDayMouseEnter = (date: Date) => {
		if (!isValidDate(date)) return;

		if (selectionMode === 'range') {
			if (isDragging && dragStart) {
				const newRange = [dragStart, date].sort((a, b) => a.getTime() - b.getTime());
				setSelectedDates(newRange);
				setHoverDate(date);
			} else if (selectedDates.length === 1) {
				setHoverDate(date);
			}
		}
	};

	// --- PRESETS ---
	const applyPreset = (presetType: string) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		let dates: Date[] = [];

		switch (presetType) {
			case 'today':
				dates = [today];
				break;
			case 'yesterday': {
				const yest = new Date(today);
				yest.setDate(yest.getDate() - 1);
				dates = [yest];
				break;
			}
			case 'thisWeek': {
				const startW = new Date(today);
				startW.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
				const endW = new Date(startW);
				endW.setDate(startW.getDate() + 6);
				dates = [startW, endW];
				break;
			}
			case 'lastWeek': {
				const startLW = new Date(today);
				startLW.setDate(
					today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1) - 7,
				);
				const endLW = new Date(startLW);
				endLW.setDate(startLW.getDate() + 6);
				dates = [startLW, endLW];
				break;
			}
			case 'thisMonth':
				dates = [
					new Date(today.getFullYear(), today.getMonth(), 1),
					new Date(today.getFullYear(), today.getMonth() + 1, 0),
				];
				break;
			case 'selectAll':
				if (selectionMode === 'multiple') {
					const days = getDaysInMonth(currentYear, currentMonth);
					dates = Array.from(
						{ length: days },
						(_, i) => new Date(currentYear, currentMonth, i + 1),
					);
				}
				break;
			case 'clear':
				dates = [];
				break;
		}

		dates = dates.filter(isValidDate);
		if (selectionMode === 'single' && dates.length > 0) dates = [dates[0]];

		setSelectedDates(dates);
		emitChange(dates);
		if (dates.length > 0) setCurrentDate(dates[0]);
	};

	// Helpers
	const isToday = (date: Date) => isSameDay(date, new Date());
	const isSelected = (date: Date) => selectedDates.some((selected) => isSameDay(selected, date));

	const isRangeStart = (date: Date) =>
		selectionMode === 'range' && selectedDates.length > 0 && isSameDay(date, selectedDates[0]);
	const isRangeEnd = (date: Date) =>
		selectionMode === 'range' && selectedDates.length > 1 && isSameDay(date, selectedDates[1]);
	const isHoverRangeEnd = (date: Date) =>
		selectionMode === 'range' &&
		selectedDates.length === 1 &&
		hoverDate &&
		isSameDay(date, hoverDate);

	const isInRangeHighlight = (date: Date) => {
		if (selectionMode !== 'range') return false;
		if (selectedDates.length === 2)
			return isDateBetween(date, selectedDates[0], selectedDates[1]);
		if (selectedDates.length === 1 && hoverDate)
			return isDateBetween(date, selectedDates[0], hoverDate);
		return false;
	};

	// ==========================================
	// RENDERIZADOS
	// ==========================================
	const renderDaysGrid = (monthOffset = 0, index: number) => {
		const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);
		const y = targetDate.getFullYear();
		const m = targetDate.getMonth();

		const daysInMonth = getDaysInMonth(y, m);
		const firstDayOfMonth = getFirstDayOfMonth(y, m);
		const daysInPrevMonth = getDaysInMonth(y, m - 1);

		const prevMonthDays = Array.from(
			{ length: firstDayOfMonth },
			(_, i) => daysInPrevMonth - firstDayOfMonth + i + 1,
		);
		const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

		return (
			<div className='w-full min-w-[240px] flex-1' key={`grid-${m}-${y}`}>
				{isPro && (
					<div
						className={`mb-4 text-center font-bold capitalize tracking-wide text-gray-800 dark:text-gray-100 ${s.text}`}>
						{MONTH_NAMES_FULL[m]} {y}
					</div>
				)}

				<div className={`mb-3 grid grid-cols-7 gap-x-0 gap-y-2 text-center`}>
					{DAY_NAMES.map((day, idx) => (
						<span
							key={day}
							className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 ${idx === 5 || idx === 6 ? 'opacity-60' : ''}`}>
							{day}
						</span>
					))}
				</div>

				<div
					className='grid grid-cols-7 gap-x-0 gap-y-1'
					ref={(el) => {
						daysGridRefs.current[index] = el;
					}}
					onMouseLeave={() => {
						if (selectionMode === 'range' && !isDragging) setHoverDate(null);
					}}>
					{prevMonthDays.map((day, i) => (
						<div
							key={`prev-${m}-${i}`}
							className={`flex items-center justify-center text-gray-300 dark:text-zinc-700 ${s.dayCell} ${s.text}`}>
							{day}
						</div>
					))}

					{currentMonthDays.map((day) => {
						const date = new Date(y, m, day);
						const isSelectedDay = isSelected(date);
						const isTodayDay = isToday(date);
						const inRange = isInRangeHighlight(date);
						const isStart = isRangeStart(date);
						const isEnd = isRangeEnd(date) || isHoverRangeEnd(date);
						const valid = isValidDate(date);
						const hasRange =
							selectedDates.length > 1 || (selectedDates.length === 1 && hoverDate);

						// Fondo de conexión: incluye start, end, y todo lo que está entre medio
						const showRangeBg = inRange || (isStart && hasRange) || (isEnd && hasRange);
						const rangeBgClass = showRangeBg
							? `bg-${themeColor}-100 dark:bg-${themeColor}-900/40`
							: '';

						// Bordes redondeados en los extremos del rango
						let rangeRounding = '';
						if (isStart && hasRange) rangeRounding = 'rounded-l-full';
						if (isEnd) rangeRounding = 'rounded-r-full';
						if (isStart && isEnd) rangeRounding = 'rounded-full';

						return (
							<div
								key={`current-${m}-${day}`}
								className={`relative flex items-center justify-center ${rangeBgClass} ${rangeRounding} ${s.dayCell}`}
								onMouseEnter={() => handleDayMouseEnter(date)}>
								<button
									onMouseDown={(e) => handleDayMouseDown(date, e)}
									disabled={!valid}
									className={`relative z-10 flex h-full w-full items-center justify-center rounded-full font-medium transition-all ${s.text} ${!valid ? 'cursor-not-allowed opacity-30' : ''} ${
										isSelectedDay
											? `bg-${themeColor}-${themeColorShade} text-white shadow-lg shadow-${themeColor}-${themeColorShade}/40 scale-[1.05]`
											: inRange
												? `text-${themeColor}-800 dark:text-${themeColor}-200`
												: valid
													? 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800'
													: ''
									} ${isTodayDay && !isSelectedDay && !inRange ? `ring-2 ring-inset ring-${themeColor}-${themeColorShade}/50 text-${themeColor}-${themeColorShade}` : ''} `}>
									{day}
								</button>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const renderMonthsView = () => (
		<div className='grid h-full grid-cols-3 items-center gap-4 pt-2'>
			{MONTH_NAMES.map((month, idx) => (
				<button
					key={month}
					onClick={() => {
						setCurrentDate(new Date(currentYear, idx, 1));
						animateViewChange('days');
					}}
					className={`flex items-center justify-center rounded-xl py-4 font-bold transition-all ${s.text} ${
						currentMonth === idx
							? `bg-${themeColor}-${themeColorShade} text-white shadow-md shadow-${themeColor}-${themeColorShade}/40 scale-105`
							: 'bg-gray-50/80 text-gray-600 hover:bg-gray-100 dark:bg-zinc-800/50 dark:text-gray-300 dark:hover:bg-zinc-800'
					} `}>
					{month}
				</button>
			))}
		</div>
	);

	const renderYearsView = () => {
		const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);
		return (
			<div className='grid h-full grid-cols-3 items-center gap-4 pt-2'>
				{years.map((year, idx) => (
					<button
						key={year}
						onClick={() => {
							setCurrentDate(new Date(year, currentMonth, 1));
							animateViewChange('months');
						}}
						className={`flex items-center justify-center rounded-xl py-4 font-bold transition-all ${s.text} ${idx === 0 || idx === 11 ? 'text-gray-400 dark:text-zinc-600' : 'text-gray-700 dark:text-gray-300'} ${
							currentYear === year
								? `bg-${themeColor}-${themeColorShade} text-white shadow-md shadow-${themeColor}-${themeColorShade}/40 scale-105`
								: 'hover:bg-gray-100 dark:hover:bg-zinc-800'
						} `}>
						{year}
					</button>
				))}
			</div>
		);
	};

	// ==========================================
	// RENDER PRINCIPAL
	// ==========================================
	const containerClasses = isPro
		? `${s.container} flex flex-col md:flex-row gap-8`
		: `${s.container} flex-col`;

	return (
		<div
			className={`relative w-full overflow-hidden ${rounded} border border-gray-200/50 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-zinc-800/50 dark:bg-zinc-900/90 ${className}`}
			style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
			{/* Orbes decorativos */}
			<div
				className={`pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-${themeColor}-${themeColorShade} opacity-10 blur-[60px]`}
			/>
			<div
				className={`pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-${themeColor}-400 opacity-[0.06] blur-[50px]`}
			/>

			{/* CONTENEDOR CON SCROLL HORIZONTAL PARA MÓVIL */}
			<div className={`w-full overflow-x-auto overflow-y-hidden ${s.padding}`}>
				<div className={`mx-auto w-max ${containerClasses}`}>
					{/* BARRA LATERAL (SOLO PRO) */}
					{isPro && (
						<div className='relative z-10 flex w-full flex-shrink-0 flex-col gap-2 border-gray-100 dark:border-zinc-800/80 md:w-52 md:border-r md:pr-6'>
							<div className='mb-3 flex items-center gap-2 pl-2 text-[10px] font-bold uppercase tracking-widest text-gray-400'>
								<svg
									className='h-3 w-3'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M13 10V3L4 14h7v7l9-11h-7z'
									/>
								</svg>
								Accesos Rápidos
							</div>
							{[
								{ id: 'today', label: 'Hoy' },
								{ id: 'yesterday', label: 'Ayer', show: selectionMode !== 'range' },
								{
									id: 'thisWeek',
									label: 'Esta Semana',
									show: selectionMode !== 'single',
								},
								{
									id: 'lastWeek',
									label: 'Semana Pasada',
									show: selectionMode !== 'single',
								},
								{
									id: 'thisMonth',
									label: 'Este Mes',
									show: selectionMode !== 'single',
								},
								{
									id: 'selectAll',
									label: 'Seleccionar Todo',
									show: selectionMode === 'multiple',
								},
							]
								.filter((p) => p.show !== false)
								.map((preset) => (
									<button
										key={preset.id}
										onClick={() => applyPreset(preset.id)}
										className={`rounded-xl px-4 py-3 text-left font-semibold text-gray-600 transition-all hover:translate-x-1 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800/80 dark:hover:text-gray-100 ${s.text}`}>
										{preset.label}
									</button>
								))}

							<div className='mt-auto border-t border-gray-100 pt-4 dark:border-zinc-800/80'>
								<button
									onClick={() => applyPreset('clear')}
									className={`w-full rounded-xl px-4 py-3 text-left font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 ${s.text}`}>
									Limpiar Selección
								</button>
							</div>
						</div>
					)}

					{/* CONTENIDO PRINCIPAL */}
					<div className='relative z-10 flex flex-1 flex-col'>
						{/* INPUTS SUPERIORES (SOLO PRO + RANGO) */}
						{isPro && selectionMode === 'range' && (
							<div className='mb-8 flex flex-wrap gap-4'>
								<div
									className={`min-w-[140px] flex-1 rounded-2xl border border-gray-200/80 bg-gray-50/80 px-5 py-3 shadow-sm backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-${themeColor}-${themeColorShade}/40 dark:border-zinc-800 dark:bg-zinc-800/40`}>
									<div className='mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400'>
										Inicio
									</div>
									<input
										type='text'
										className={`w-full bg-transparent font-bold text-gray-800 outline-none placeholder:font-normal placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-zinc-500 ${s.text}`}
										placeholder='DD/MM/YYYY'
										value={inputStart}
										onChange={(e) => {
											const val = formatDateInput(e.target.value);
											setInputStart(val);
											const d = parseFormattedDate(val);
											if (d && isValidDate(d)) {
												let newRange = [d];
												if (selectedDates.length > 1) {
													newRange = [d, selectedDates[1]].sort(
														(a, b) => a.getTime() - b.getTime(),
													);
												} else if (selectedDates.length === 1) {
													newRange = [d, selectedDates[0]].sort(
														(a, b) => a.getTime() - b.getTime(),
													);
												}
												setSelectedDates(newRange);
												setCurrentDate(newRange[0]);
												emitChange(newRange);
											}
										}}
									/>
								</div>
								<div className='flex items-center text-gray-300 dark:text-zinc-600'>
									<svg
										className='h-5 w-5'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M14 5l7 7m0 0l-7 7m7-7H3'
										/>
									</svg>
								</div>
								<div
									className={`min-w-[140px] flex-1 rounded-2xl border border-gray-200/80 bg-gray-50/80 px-5 py-3 shadow-sm backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-${themeColor}-${themeColorShade}/40 dark:border-zinc-800 dark:bg-zinc-800/40`}>
									<div className='mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400'>
										Fin
									</div>
									<input
										type='text'
										className={`w-full bg-transparent font-bold text-gray-800 outline-none placeholder:font-normal placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-zinc-500 ${s.text}`}
										placeholder='DD/MM/YYYY'
										value={inputEnd}
										onChange={(e) => {
											const val = formatDateInput(e.target.value);
											setInputEnd(val);
											const d = parseFormattedDate(val);
											if (d && isValidDate(d)) {
												let newRange = [d];
												if (selectedDates.length > 0) {
													newRange = [selectedDates[0], d].sort(
														(a, b) => a.getTime() - b.getTime(),
													);
												}
												setSelectedDates(newRange);
												setCurrentDate(newRange[1] || newRange[0]);
												emitChange(newRange);
											}
										}}
									/>
								</div>
							</div>
						)}

						{/* HEADER */}
						<div className='mb-6 flex items-center justify-between'>
							<div className='flex flex-col'>
								{!isPro ? (
									<div
										className='group flex cursor-pointer items-center gap-2'
										onClick={() =>
											animateViewChange(
												viewMode === 'days' ? 'months' : 'days',
											)
										}>
										<span
											className={`${s.header} font-black capitalize tracking-tight text-gray-800 transition-colors group-hover:text-${themeColor}-${themeColorShade} dark:text-gray-100`}>
											{viewMode === 'years'
												? `${decadeStart} - ${decadeStart + 9}`
												: MONTH_NAMES_FULL[currentMonth]}
										</span>
										{viewMode !== 'years' && (
											<span
												className={`${s.header} font-light text-gray-400 transition-colors group-hover:text-gray-600 dark:text-zinc-500`}>
												{currentYear}
											</span>
										)}
										<svg
											className={`h-5 w-5 text-gray-300 transition-transform ${viewMode !== 'days' ? 'rotate-180' : ''}`}
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19 9l-7 7-7-7'
											/>
										</svg>
									</div>
								) : (
									<span
										className={`${s.header} font-black tracking-tight text-gray-800 dark:text-gray-100`}>
										{selectionMode === 'range'
											? 'Selecciona un periodo'
											: 'Selecciona fechas'}
									</span>
								)}

								{!isPro && (
									<span
										className={`mt-1 text-[10px] font-bold uppercase tracking-widest text-${themeColor}-${themeColorShade}`}>
										{selectionMode === 'range'
											? 'Selección Arrastrable'
											: selectionMode === 'multiple'
												? 'Selección Múltiple'
												: 'Fecha Única'}
									</span>
								)}
							</div>

							<div className='flex gap-1.5 rounded-full border border-white/20 bg-gray-100/80 p-1.5 shadow-sm backdrop-blur-md dark:bg-zinc-800/80'>
								<button
									onClick={handlePrev}
									className='flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm active:scale-90 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-white'>
									<svg
										className='h-4 w-4'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2.5}
											d='M15 19l-7-7 7-7'
										/>
									</svg>
								</button>
								<button
									onClick={handleNext}
									className='flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-white hover:text-gray-900 hover:shadow-sm active:scale-90 dark:text-gray-400 dark:hover:bg-zinc-700 dark:hover:text-white'>
									<svg
										className='h-4 w-4'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2.5}
											d='M9 5l7 7-7 7'
										/>
									</svg>
								</button>
							</div>
						</div>

						{/* CONTENEDOR DE VISTAS */}
						<div className='relative min-h-[260px]' ref={viewContainerRef}>
							{viewMode === 'days' && (
								<div className={`flex flex-col gap-8 md:flex-row`}>
									{renderDaysGrid(0, 0)}
									{isPro && renderDaysGrid(1, 1)}
								</div>
							)}
							{viewMode === 'months' && renderMonthsView()}
							{viewMode === 'years' && renderYearsView()}
						</div>

						{/* FOOTER (Solo base) */}
						{!isPro && (
							<div className='mt-4 flex gap-3 border-t border-gray-100/80 pt-4 dark:border-zinc-800/50'>
								<button
									onClick={() => {
										applyPreset('today');
										setViewMode('days');
									}}
									className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-50/80 py-3 font-bold text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900 active:scale-95 dark:bg-zinc-800/50 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white ${s.text}`}>
									<div
										className={`h-2 w-2 rounded-full bg-${themeColor}-${themeColorShade} animate-pulse`}
									/>
									Hoy
								</button>
								{selectionMode !== 'single' && (
									<button
										onClick={() => applyPreset('clear')}
										className={`flex flex-none items-center justify-center rounded-xl bg-red-50/50 px-4 py-3 font-bold text-red-500 transition-all hover:bg-red-100 active:scale-95 dark:bg-red-500/10 dark:hover:bg-red-500/20 ${s.text}`}
										title='Limpiar'>
										<svg
											className='h-4 w-4'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
												d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
											/>
										</svg>
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Calendar;
