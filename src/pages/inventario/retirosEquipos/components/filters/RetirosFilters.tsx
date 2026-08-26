import React, { useEffect, useState } from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import QuickFilters from '../parts/QuickFilters';
import type { QuickFilterKey } from '../../hooks/useRetirosEquipos';

interface RetirosFiltersProps {
	quickFilter: QuickFilterKey;
	searchValue: string;
	onQuickFilterChange: (key: QuickFilterKey) => void;
	onSearchChange: (value: string) => void;
}

const RetirosFilters: React.FC<RetirosFiltersProps> = ({
	quickFilter,
	searchValue,
	onQuickFilterChange,
	onSearchChange,
}) => {
	const [searchDraft, setSearchDraft] = useState(searchValue);

	useEffect(() => setSearchDraft(searchValue), [searchValue]);

	const clear = () => {
		setSearchDraft('');
		onSearchChange('');
		onQuickFilterChange('all');
	};

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='DuoFilter' size='text-xl' />
					<CardTitle className='text-lg'>Filtros</CardTitle>
				</div>
				<Button variant='outline' size='sm' icon='HeroXMark' onClick={clear}>
					Limpiar
				</Button>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 md:grid-cols-2'>
					<div>
						<label
							htmlFor='withdrawals-search'
							className='mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Búsqueda
						</label>
						<Input
							id='withdrawals-search'
							name='search'
							value={searchDraft}
							placeholder='Código, notas o serie'
							onChange={(event) => {
								setSearchDraft(event.target.value);
								onSearchChange(event.target.value);
							}}
						/>
						<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
							La búsqueda se aplica automáticamente.
						</p>
					</div>
					<div>
						<p className='mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
							Vista
						</p>
						<QuickFilters active={quickFilter} onChange={onQuickFilterChange} />
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default RetirosFilters;
