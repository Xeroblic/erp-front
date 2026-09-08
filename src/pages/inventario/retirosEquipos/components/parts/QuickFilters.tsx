import React from 'react';
import Button from '@/components/ui/Button';
import { QUICK_FILTERS } from '../../hooks/useRetirosEquipos';
import type { QuickFilterKey } from '../../hooks/useRetirosEquipos';

interface IQuickFiltersProps {
	active: QuickFilterKey;
	onChange: (key: QuickFilterKey) => void;
}

/**
 * Filtros rápidos del listado (§9):
 * - "Qué hay afuera" → ?status=confirmed&type=loan
 * - "Borradores estancados" → ?stale=true
 */
const QuickFilters: React.FC<IQuickFiltersProps> = ({ active, onChange }) => (
	<div
		role='group'
		aria-label='Filtros rápidos de retiros'
		className='flex flex-wrap items-center gap-2'>
		{QUICK_FILTERS.map((filter) => {
			const isActive = filter.key === active;
			return (
				<Button
					key={filter.key}
					variant={isActive ? 'solid' : 'ghost'}
					color={isActive ? 'blue' : 'zinc'}
					size='sm'
					isActive={isActive}
					aria-pressed={isActive}
					onClick={() => onChange(filter.key)}>
					{filter.label}
				</Button>
			);
		})}
	</div>
);

export default QuickFilters;
