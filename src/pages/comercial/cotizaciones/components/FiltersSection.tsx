import Input from '@/components/form/Input';
import SelectReact, { TSelectOptions, TSelectOption } from '@/components/form/SelectReact';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import { normalizeQuoteStatusValue, quoteStatusOptions } from '../constants/quoteStatuses';
import { QuoteStatus } from '@/interface';
import Button from '@/components/ui/Button';

const statusSelectOptions: TSelectOptions = [
	{ value: '', label: 'Todos los estados' },
	...quoteStatusOptions,
];

export const FiltersSection = ({
	filters,
	setFilters,
	showFilters,
	setShowFilters,
	resetFilters,
}: any) => {
	return (
	<Card className='mb-6'>
		<CardHeader>
			<CardHeaderChild>
				<CardTitle>Filtros</CardTitle>
			</CardHeaderChild>
		</CardHeader>
		<CardBody>
			<div className='mb-3'>
				<p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
					Filtros de carga backend
				</p>
			</div>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4'>
				<Input
					name='search'
					placeholder='Buscar por número o notas...'
					value={filters.search || ''}
					onChange={(e: any) => setFilters({ ...filters, search: e.target.value })}
				/>

				<SelectReact
					name='status'
					placeholder='Todos los estados'
					options={statusSelectOptions}
					value={
						filters.status
							? ((statusSelectOptions.find(
									(option) =>
										option.value === normalizeQuoteStatusValue(filters.status),
								) as TSelectOption | undefined) ?? null)
							: null
					}
					isClearable
					onChange={(option) => {
						const selected = option as TSelectOption | null;
						setFilters({
							...filters,
							status: selected?.value
								? (selected.value as QuoteStatus)
								: undefined,
						});
					}}
				/>

				<Input
					name='customer'
					placeholder='Cliente o ID cliente...'
					value={filters.customer || ''}
					onChange={(e: any) => {
						const nextValue = e.target.value ?? '';
						const numericValue = Number(nextValue);
						setFilters({
							...filters,
							customer: nextValue,
							customerId:
								nextValue.trim() && Number.isFinite(numericValue) && numericValue > 0
									? numericValue
									: undefined,
						});
					}}
				/>

				<div className='flex space-x-2'>
					<Button variant='outline' onClick={resetFilters} icon='HeroXMark'>
						Limpiar
					</Button>
					<Button onClick={() => setShowFilters(!showFilters)} icon='HeroFunnel'>
						{showFilters ? 'Ocultar' : 'Más filtros'}
					</Button>
				</div>
			</div>

			{showFilters && (
				<>
					<div className='mt-4 mb-3'>
						<p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
							Filtros locales sobre resultados cargados
						</p>
					</div>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Input
						name='dateFrom'
						type='date'
						placeholder='Fecha desde'
						value={filters.dateFrom || ''}
						onChange={(e: any) => setFilters({ ...filters, dateFrom: e.target.value })}
					/>
					<Input
						name='dateTo'
						type='date'
						placeholder='Fecha hasta'
						value={filters.dateTo || ''}
						onChange={(e: any) => setFilters({ ...filters, dateTo: e.target.value })}
					/>
					<Input
						name='minAmount'
						type='number'
						placeholder='Monto mínimo'
						value={filters.minAmount ?? ''}
						onChange={(e: any) => {
							const nextValue = e.target.value ?? '';
							const numericValue = Number(nextValue);
							setFilters({
								...filters,
								minAmount:
									nextValue !== '' && Number.isFinite(numericValue)
										? numericValue
										: undefined,
							});
						}}
					/>
					<Input
						name='maxAmount'
						type='number'
						placeholder='Monto máximo'
						value={filters.maxAmount ?? ''}
						onChange={(e: any) => {
							const nextValue = e.target.value ?? '';
							const numericValue = Number(nextValue);
							setFilters({
								...filters,
								maxAmount:
									nextValue !== '' && Number.isFinite(numericValue)
										? numericValue
										: undefined,
							});
						}}
					/>
					</div>
				</>
			)}
		</CardBody>
	</Card>
);
};
