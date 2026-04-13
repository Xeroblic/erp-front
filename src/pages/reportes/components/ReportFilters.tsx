import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Calendar from '@/components/ui/Calendar';
import type { CalendarOutputData } from '@/components/ui/Calendar';
import { useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import {
	selectThemeColor,
	selectThemeColorShade,
} from '@/store/slices/personalizacion/personalizacionSlice';
import type { ReportFiltersState } from '../types';

interface ReportFiltersProps {
	initial?: ReportFiltersState;
	onApply: (filters: ReportFiltersState) => void;
	onReset?: () => void;
}

/**
 * Formatea Date → 'YYYY-MM-DD' en hora LOCAL (evita desfase UTC en Chile UTC-3).
 */
const toLocalISODate = (d: Date): string => {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

/** Formatea Date → 'dd-mm-yyyy' para display */
const toLocalDisplay = (d: Date): string => {
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();
	return `${day}-${month}-${year}`;
};

/** Parsea 'YYYY-MM-DD' → Date (en hora local) */
const parseISO = (s: string): Date | null => {
	if (!s) return null;
	const d = new Date(`${s}T00:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
};

/** Tiempo de inactividad para cerrar el dropdown (ms) */
const INACTIVITY_TIMEOUT = 10_000;

// ─── Report Filters ───────────────────────────────────────────────────────────
const ReportFilters: React.FC<ReportFiltersProps> = ({ initial, onApply, onReset }) => {
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const themeColor = useAppSelector(selectThemeColor) || 'violet';
	const themeColorShade = useAppSelector(selectThemeColorShade) || 500;

	const [calendarOpen, setCalendarOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Default a los últimos 30 días
	const getDefaultDates = () => {
		const end = new Date();
		const start = new Date();
		start.setDate(end.getDate() - 30);
		return {
			dateFrom: toLocalISODate(start),
			dateTo: toLocalISODate(end),
		};
	};

	const [filters, setFilters] = useState<ReportFiltersState>(() => {
		if (initial) return initial;
		const defaults = getDefaultDates();
		return {
			...defaults,
			parameter: '',
			priceMin: '',
			priceMax: '',
			subsidiary: effectiveSubsidiaryId ? String(effectiveSubsidiaryId) : '',
			branch: '',
			customer: '',
		};
	});

	// ── Cerrar por click fuera ──
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setCalendarOpen(false);
			}
		};
		if (calendarOpen) document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [calendarOpen]);

	// ── Auto-cierre por inactividad (10s) ──
	const resetInactivityTimer = useCallback(() => {
		if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
		if (calendarOpen) {
			inactivityTimer.current = setTimeout(() => {
				setCalendarOpen(false);
			}, INACTIVITY_TIMEOUT);
		}
	}, [calendarOpen]);

	// Iniciar/resetear timer cuando el dropdown se abre
	useEffect(() => {
		if (calendarOpen) {
			resetInactivityTimer();
		} else {
			if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
		}
		return () => {
			if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
		};
	}, [calendarOpen, resetInactivityTimer]);

	// Construir las fechas iniciales para el Calendar
	const calendarValue = useMemo((): Date[] => {
		const dates: Date[] = [];
		const from = filters.dateFrom ? parseISO(filters.dateFrom) : null;
		const to = filters.dateTo ? parseISO(filters.dateTo) : null;
		if (from) dates.push(from);
		if (to) dates.push(to);
		return dates;
	}, [filters.dateFrom, filters.dateTo]);

	// Display strings
	const displayFrom = filters.dateFrom ? toLocalDisplay(parseISO(filters.dateFrom)!) : '';
	const displayTo = filters.dateTo ? toLocalDisplay(parseISO(filters.dateTo)!) : '';
	const hasDateRange = displayFrom || displayTo;

	// Resetear branch cuando cambia la subsidiaria
	useEffect(() => {
		if (filters.subsidiary && effectiveSubsidiaryId) {
			const selectedSubsidiaryId = Number(filters.subsidiary);
			if (selectedSubsidiaryId !== effectiveSubsidiaryId) {
				setFilters((f) => ({ ...f, branch: '' }));
			}
		}
	}, [filters.subsidiary, effectiveSubsidiaryId]);

	const validation = useMemo(() => {
		const errors: string[] = [];
		if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
			errors.push('El rango de fechas es inválido.');
		}
		if (
			filters.priceMin !== '' &&
			filters.priceMax !== '' &&
			Number(filters.priceMin) > Number(filters.priceMax)
		) {
			errors.push('El rango de precios es inválido.');
		}
		return { isValid: errors.length === 0, errors };
	}, [filters]);

	const handleCalendarChange = (data: CalendarOutputData) => {
		const rawDates = data.rawDates;

		// Resetear timer de inactividad cada vez que el usuario interactúa
		resetInactivityTimer();

		if (rawDates.length === 0) {
			setFilters((f) => ({ ...f, dateFrom: '', dateTo: '' }));
			return;
		}

		const dateFrom = toLocalISODate(rawDates[0]);
		const dateTo = rawDates.length >= 2 ? toLocalISODate(rawDates[1]) : '';

		setFilters((f) => ({ ...f, dateFrom, dateTo }));

		// NUNCA cerrar automáticamente — solo click afuera o inactividad
	};

	const handleClearDates = (e: React.MouseEvent) => {
		e.stopPropagation();
		const defaults = getDefaultDates();
		setFilters((f) => ({ ...f, ...defaults }));
	};

	// Auto-Apply Asíncrono
	useEffect(() => {
		if (!validation.isValid) return;
		const timer = setTimeout(() => {
			onApply(filters);
		}, 800);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters, validation.isValid]);

	const handleReset = () => {
		const defaults = getDefaultDates();
		const empty: ReportFiltersState = {
			...defaults,
			parameter: '',
			priceMin: '',
			priceMax: '',
			subsidiary: '',
			branch: '',
			customer: '',
		};
		setFilters(empty);
		onApply(empty);
		onReset?.();
	};

	return (
		<Card
			className={``}>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					{/* ── Rango de Fechas (Dropdown con Calendar Pro) ── */}
					<div ref={dropdownRef} className='relative'>
						<label className='text-xs text-zinc-500'>Rango de fechas</label>
						<div
							className={`flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-all focus-within:ring-2 focus-within:ring-${themeColor}-200 hover:border-${themeColor}-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-${themeColor}-600`}
							onClick={() => {
								setCalendarOpen(!calendarOpen);
							}}>
							{/* Icono calendario */}
							<svg
								className={`h-4 w-4 flex-shrink-0 text-${themeColor}-400`}
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
								/>
							</svg>

							{hasDateRange ? (
								<span className='flex-1 truncate text-zinc-800 dark:text-zinc-200'>
									{displayFrom}
									{displayTo ? ` → ${displayTo}` : ' → ...'}
								</span>
							) : (
								<span className='flex-1 text-zinc-400'>Seleccionar rango...</span>
							)}

							{/* Limpiar */}
							{hasDateRange && (
								<button
									className='rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700'
									onClick={handleClearDates}>
									<svg
										className='h-3.5 w-3.5'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
											d='M6 18L18 6M6 6l12 12'
										/>
									</svg>
								</button>
							)}

							{/* Chevron */}
							<svg
								className={`h-4 w-4 text-zinc-400 transition-transform ${calendarOpen ? 'rotate-180' : ''}`}
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

						{/* Dropdown Calendar Pro */}
						{calendarOpen && (
							<div
								className='absolute left-0 z-50 mt-2'
								onMouseMove={resetInactivityTimer}
								onClick={resetInactivityTimer}>
								<Calendar
									value={calendarValue.length > 0 ? calendarValue : undefined}
									selectionMode='range'
									variant='pro'
									themeColor={themeColor as 'violet'}
									themeColorShade={500}
									rounded='rounded-2xl'
									onChange={handleCalendarChange}
									maxDate={new Date()}
								/>
							</div>
						)}
					</div>

					{/* ── Precio Min ── */}
					<div>
						<label className='text-xs text-zinc-500'>Precio mín.</label>
						<Input
							name='priceMin'
							type='number'
							value={filters.priceMin}
							onChange={(e) =>
								setFilters((f) => ({
									...f,
									priceMin: e.target.value === '' ? '' : Number(e.target.value),
								}))
							}
							min={0}
						/>
					</div>

					{/* ── Precio Max ── */}
					<div>
						<label className='text-xs text-zinc-500'>Precio máx.</label>
						<Input
							name='priceMax'
							type='number'
							value={filters.priceMax}
							onChange={(e) =>
								setFilters((f) => ({
									...f,
									priceMax: e.target.value === '' ? '' : Number(e.target.value),
								}))
							}
							min={0}
						/>
					</div>
				</div>

				{!validation.isValid && (
					<div className='mt-3 rounded border-l-4 border-rose-400 bg-rose-50 p-2 text-sm text-rose-700'>
						<ul className='list-disc pl-6'>
							{validation.errors.map((e, i) => (
								<li key={i}>{e}</li>
							))}
						</ul>
					</div>
				)}

				<div className='mt-4 flex items-center justify-end gap-3'>
					{!validation.isValid ? (
						<span className='text-xs font-medium text-zinc-500'>
							Corrige los errores para aplicar...
						</span>
					) : (
						<span className='mr-auto text-xs font-medium text-emerald-600 dark:text-emerald-400'>
							Filtros aplicados automáticamente
						</span>
					)}
					<Button
						variant='outline'
						color={themeColor as 'violet'}
						rightIcon='HeroArrowPath'
						onClick={handleReset}>
						Limpiar
					</Button>
				</div>
			</CardBody>
		</Card>
	);
};

export { type ReportFiltersState };
export default ReportFilters;
