import React, { useMemo, useState, useEffect } from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import { useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import type { ReportFiltersState } from '../types';

interface ReportFiltersProps {
	initial?: ReportFiltersState;
	onApply: (filters: ReportFiltersState) => void;
	onReset?: () => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ initial, onApply, onReset }) => {
	const effectiveSubsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const [filters, setFilters] = useState<ReportFiltersState>(
		initial ?? {
			dateFrom: '',
			dateTo: '',
			parameter: '',
			priceMin: '',
			priceMax: '',
			subsidiary: effectiveSubsidiaryId ? String(effectiveSubsidiaryId) : '',
			branch: '',
			customer: '',
		},
	);

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

	const handleApply = () => {
		if (!validation.isValid) return;
		onApply(filters);
	};

	const handleReset = () => {
		const empty: ReportFiltersState = {
			dateFrom: '',
			dateTo: '',
			parameter: '',
			priceMin: '',
			priceMax: '',
			subsidiary: '',
			branch: '',
			customer: '',
		};
		setFilters(empty);
		onReset?.();
	};

	return (
		<Card className='border border-violet-200/60 bg-gradient-to-br from-violet-50 to-violet-50/60 dark:from-violet-900/10 dark:to-transparent'>
			<CardBody>
				<div className='grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4'>
					<div>
						<label className='text-xs text-zinc-500'>Desde</label>
						<Input
							name='dateFrom'
							type='date'
							value={filters.dateFrom}
							onChange={(e) =>
								setFilters((f) => ({ ...f, dateFrom: e.target.value }))
							}
						/>
					</div>
					<div>
						<label className='text-xs text-zinc-500'>Hasta</label>
						<Input
							name='dateTo'
							type='date'
							value={filters.dateTo}
							onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
						/>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div>
							<label className='text-xs text-zinc-500'>Precio mín.</label>
							<Input
								name='priceMin'
								type='number'
								value={filters.priceMin}
								onChange={(e) =>
									setFilters((f) => ({
										...f,
										priceMin:
											e.target.value === '' ? '' : Number(e.target.value),
									}))
								}
								min={0}
							/>
						</div>
						<div>
							<label className='text-xs text-zinc-500'>Precio máx.</label>
							<Input
								name='priceMax'
								type='number'
								value={filters.priceMax}
								onChange={(e) =>
									setFilters((f) => ({
										...f,
										priceMax:
											e.target.value === '' ? '' : Number(e.target.value),
									}))
								}
								min={0}
							/>
						</div>
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

				<div className='mt-4 flex items-center gap-3'>
					<Button
						color='violet'
						variant='solid'
						icon='HeroFunnel'
						onClick={handleApply}
						isDisable={!validation.isValid}>
						Aplicar filtros
					</Button>
					<Button
						variant='outline'
						color='violet'
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
