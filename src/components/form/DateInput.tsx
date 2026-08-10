import React, { useEffect, useMemo, useRef, useState } from 'react';
import FieldWrap from './FieldWrap';
import Input from './Input';
import type { IValidationBaseProps } from './Validation';
import Icon from '@/components/icon/Icon';
import { toApiDate } from '@/utils/dateNormalize.util';

type Props = {
	name: string;
	value?: string | null; // expects ISO yyyy-mm-dd or empty
	onChange?: (e: { target: { name: string; value: string } }) => void;
	onBlur?: React.FocusEventHandler<HTMLInputElement>;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	className?: string;
	minYear?: number;
	maxYear?: number;
	minDate?: Date;
	maxDate?: Date;
} & Partial<IValidationBaseProps>;

const isoToDisplay = (v?: string | null): string => {
	if (!v) return '';
	const s = String(v).trim();
	if (!s) return '';
	const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (m) return `${m[3]}-${m[2]}-${m[1]}`; // dd-mm-yyyy
	const m2 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (m2) return s; // already display format
	return '';
};

const formatDisplayMask = (raw: string): string => {
	const digits = raw.replace(/\D/g, '').slice(0, 8);
	const dd = digits.slice(0, 2);
	const mm = digits.slice(2, 4);
	const yyyy = digits.slice(4, 8);
	let out = dd;
	if (mm) out += `-${mm}`;
	if (yyyy) out += `-${yyyy}`;
	return out;
};

const DateInput: React.FC<Props> = ({
	name,
	value,
	onChange,
	onBlur,
	placeholder = 'dd-mm-aaaa',
	disabled,
	id,
	className,
	minYear,
	maxYear,
	minDate,
	maxDate,
	isValid,
	isTouched,
	invalidFeedback,
}) => {
	const [display, setDisplay] = useState<string>(isoToDisplay(value));
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
	const [cursor, setCursor] = useState<Date>(() => {
		const iso = (value as string) || '';
		if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T00:00:00`);
		return new Date();
	});
	const rootRef = useRef<HTMLDivElement>(null);

	const yearMin = typeof minYear === 'number' ? minYear : 1900;
	const yearMax = typeof maxYear === 'number' ? maxYear : new Date().getFullYear();
	const years = Array.from({ length: yearMax - yearMin + 1 }, (_, i) => yearMin + i);

	const minD = useMemo(() => minDate ?? new Date(yearMin, 0, 1), [minDate, yearMin]);
	const maxD = useMemo(() => maxDate ?? new Date(), [maxDate]);
	const clampToRange = (d: Date) =>
		new Date(Math.min(Math.max(d.getTime(), minD.getTime()), maxD.getTime()));
	const inRange = (d: Date) =>
		d.getTime() >= new Date(minD.getFullYear(), minD.getMonth(), minD.getDate()).getTime() &&
		d.getTime() <= new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate()).getTime();

	useEffect(() => {
		setDisplay(isoToDisplay(value));
		if (value) setCursor(new Date(`${value}T00:00:00`));
	}, [value]);

	useEffect(() => {
		const onDoc = (e: MouseEvent) => {
			if (!rootRef.current) return;
			if (!rootRef.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('mousedown', onDoc);
		return () => document.removeEventListener('mousedown', onDoc);
	}, []);

	const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const masked = formatDisplayMask(e.target.value);
		setDisplay(masked);
		const iso = toApiDate(masked) || '';
		onChange?.({ target: { name, value: iso } });
	};

	const openPicker = () => setOpen((v) => !v);

	const monthLabel = () => cursor.toLocaleDateString('es-ES', { month: 'long' });

	const startOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
	const endOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
	const startOffset = (startOfMonth.getDay() + 6) % 7;
	const daysInGrid = startOffset + endOfMonth.getDate();
	const totalCells = Math.ceil(daysInGrid / 7) * 7;
	const dayCells: { d: Date; inMonth: boolean }[] = [];
	for (let i = 0; i < totalCells; i++) {
		const day = i - startOffset + 1;
		const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
		const inMonth = day >= 1 && day <= endOfMonth.getDate();
		dayCells.push({ d: date, inMonth });
	}

	const selectedISO = (value as string) || '';
	const onPick = (d: Date) => {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const iso = `${yyyy}-${mm}-${dd}`;
		setDisplay(isoToDisplay(iso));
		onChange?.({ target: { name, value: iso } });
		setOpen(false);
	};

	// Helpers navegación
	const addMonths = (n: number) =>
		setCursor(clampToRange(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1)));
	const addYears = (n: number) =>
		setCursor(clampToRange(new Date(cursor.getFullYear() + n, cursor.getMonth(), 1)));

	const currentYear = cursor.getFullYear();
	const decadeStart = Math.floor(currentYear / 12) * 12;
	const yearsGrid = Array.from({ length: 12 }, (_, i) => decadeStart + i);

	const months = [
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

	return (
		<div className='relative' ref={rootRef}>
			<FieldWrap
				isValid={isValid}
				isTouched={isTouched}
				invalidFeedback={invalidFeedback}
				lastSuffix={
					<Icon
						icon='HeroCalendarDays'
						className='mx-2 cursor-pointer'
						onClick={openPicker}
					/>
				}>
				<Input
					id={id || name}
					name={`${name}__display`}
					value={display}
					placeholder={placeholder}
					onChange={handleTypedChange}
					onBlur={onBlur}
					disabled={disabled}
					className={className}
					isValid={isValid}
					isTouched={isTouched}
					invalidFeedback={invalidFeedback}
				/>
			</FieldWrap>
			{open && (
				<div className='absolute z-50 mt-2 w-80 rounded-md border bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
					{/* Header con navegación reactiva */}
					<div className='mb-2 flex items-center justify-between gap-2'>
						<div className='flex items-center gap-1'>
							<button
								type='button'
								className='rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800'
								title='Anterior'
								onClick={() =>
									mode === 'days'
										? addMonths(-1)
										: mode === 'months'
											? addYears(-1)
											: addYears(-12)
								}>
								<Icon icon='HeroChevronLeft' />
							</button>
							<button
								type='button'
								className='rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800'
								title='Anterior rápido'
								onClick={() =>
									mode === 'days'
										? addYears(-1)
										: mode === 'months'
											? addYears(-12)
											: addYears(-24)
								}>
								<Icon icon='HeroChevronDoubleLeft' />
							</button>
						</div>
						<div className='flex items-center gap-2'>
							<button
								type='button'
								className='rounded px-2 py-1 text-sm capitalize hover:bg-zinc-100 dark:hover:bg-zinc-800'
								onClick={() => setMode(mode === 'months' ? 'days' : 'months')}>
								{monthLabel()}
							</button>
							<button
								type='button'
								className='rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800'
								onClick={() => setMode(mode === 'years' ? 'days' : 'years')}>
								{currentYear}
							</button>
						</div>
						<div className='flex items-center gap-1'>
							<button
								type='button'
								className='rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800'
								title='Siguiente rápido'
								onClick={() =>
									mode === 'days'
										? addYears(1)
										: mode === 'months'
											? addYears(12)
											: addYears(24)
								}>
								<Icon icon='HeroChevronDoubleRight' />
							</button>
							<button
								type='button'
								className='rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800'
								title='Siguiente'
								onClick={() =>
									mode === 'days'
										? addMonths(1)
										: mode === 'months'
											? addYears(1)
											: addYears(12)
								}>
								<Icon icon='HeroChevronRight' />
							</button>
						</div>
					</div>

					{/* Cuerpo según modo */}
					{mode === 'days' && (
						<>
							<div className='grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 dark:text-zinc-400'>
								{['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
									<div key={d} className='py-1'>
										{d}
									</div>
								))}
							</div>
							<div className='mt-1 grid grid-cols-7 gap-1 text-center'>
								{dayCells.map(({ d, inMonth }, idx) => {
									const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
									const isSelected = selectedISO === iso;
									const isToday = (() => {
										const t = new Date();
										return t.toDateString() === d.toDateString();
									})();
									const disabledCell = !inRange(d);
									return (
										<button
											key={idx}
											type='button'
											onClick={() => !disabledCell && onPick(d)}
											className={`rounded py-1 text-sm transition-colors ${
												inMonth
													? 'font-medium text-zinc-900 dark:text-white'
													: 'text-zinc-400 dark:text-zinc-500'
											} ${isSelected ? 'font-medium' : ''} ${
												!isSelected
													? 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
													: ''
											} ${
												disabledCell
													? 'cursor-not-allowed opacity-40 hover:bg-transparent'
													: ''
											}`}
											style={
												isSelected
													? {
															backgroundColor:
																'var(--color-primary-200)',
															color: 'var(--color-primary-900)',
														}
													: {}
											}>
											<span
												className={
													isToday
														? 'underline decoration-dotted underline-offset-2'
														: ''
												}>
												{d.getDate()}
											</span>
										</button>
									);
								})}
							</div>
						</>
					)}

					{mode === 'months' && (
						<div className='grid grid-cols-4 gap-2 p-1'>
							{months.map((m, idx) => {
								const monthStart = new Date(currentYear, idx, 1);
								const monthEnd = new Date(currentYear, idx + 1, 0);
								const disabledMonth = monthEnd < minD || monthStart > maxD;
								return (
									<button
										key={m}
										type='button'
										className={`rounded px-2 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
											disabledMonth
												? 'cursor-not-allowed opacity-40 hover:bg-transparent'
												: ''
										}`}
										onClick={() => {
											if (!disabledMonth) {
												setCursor(new Date(currentYear, idx, 1));
												setMode('days');
											}
										}}>
										{m}
									</button>
								);
							})}
						</div>
					)}

					{mode === 'years' && (
						<div className='grid grid-cols-4 gap-2 p-1'>
							{yearsGrid.map((y) => {
								const disabledYear =
									y < yearMin ||
									y > yearMax ||
									new Date(y, 11, 31) < minD ||
									new Date(y, 0, 1) > maxD;
								return (
									<button
										key={y}
										type='button'
										className={`rounded px-2 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
											y === currentYear ? 'font-medium' : ''
										}${
											disabledYear
												? 'cursor-not-allowed opacity-40 hover:bg-transparent'
												: ''
										}`}
										onClick={() => {
											if (!disabledYear) {
												setCursor(new Date(y, cursor.getMonth(), 1));
												setMode('months');
											}
										}}>
										{y}
									</button>
								);
							})}
						</div>
					)}

					<div className='mt-2 flex justify-between text-xs'>
						<button
							type='button'
							className='rounded px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800'
							onClick={() => onPick(new Date())}>
							Hoy
						</button>
						<button
							type='button'
							className='rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
							onClick={() => setOpen(false)}>
							Cerrar
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default DateInput;
