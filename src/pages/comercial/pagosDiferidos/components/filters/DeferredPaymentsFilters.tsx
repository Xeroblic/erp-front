import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
	DeferredPaymentsFilters,
	DeferredPaymentStatusFilter,
} from '@/interface/deferredPayments.interface';

const dueDateMaxYear = new Date().getFullYear() + 10;
const dueDateMax = new Date(dueDateMaxYear, 11, 31);
const deferredPaymentStatusFilters: readonly DeferredPaymentStatusFilter[] = [
	'pending',
	'partially_paid',
	'paid',
	'overdue',
];

const statusOptions: TSelectOption[] = [
	{ value: 'pending', label: 'Pendiente' },
	{ value: 'partially_paid', label: 'Parcial' },
	{ value: 'paid', label: 'Pagado' },
	{ value: 'overdue', label: 'Vencido' },
];

const isMultiValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
): value is MultiValue<TSelectOption> => Array.isArray(value);

const isDeferredPaymentStatusFilter = (value: unknown): value is DeferredPaymentStatusFilter =>
	typeof value === 'string' &&
	deferredPaymentStatusFilters.includes(value as DeferredPaymentStatusFilter);

interface DeferredPaymentsFiltersProps {
	filters: DeferredPaymentsFilters;
	search: string;
	onSearchChange: (value: string) => void;
	onChange: (patch: Partial<DeferredPaymentsFilters>) => void;
	onReset: () => void;
}

const fieldLabelClass = 'mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

const DeferredPaymentsFiltersBar: React.FC<DeferredPaymentsFiltersProps> = ({
	filters,
	search,
	onSearchChange,
	onChange,
	onReset,
}) => {
	const selectedStatus = statusOptions.find((option) => option.value === filters.status) ?? null;
	const hasInvalidDateRange = Boolean(
		filters.due_after && filters.due_before && filters.due_after > filters.due_before,
	);
	const handleStatusChange = (value: SingleValue<TSelectOption> | MultiValue<TSelectOption>) => {
		const selected = isMultiValue(value) ? value[0] : value;
		const nextStatus = selected?.value;
		onChange({
			status: isDeferredPaymentStatusFilter(nextStatus) ? nextStatus : undefined,
		});
	};

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='DuoFilter' size='text-xl' />
					<CardTitle className='text-lg'>Filtros</CardTitle>
				</div>
				<Button variant='outline' size='sm' icon='HeroXMark' onClick={onReset}>
					Limpiar
				</Button>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 md:grid-cols-2 xl:grid-cols-5'>
					<div className='xl:col-span-2'>
						<label htmlFor='deferred-search' className={fieldLabelClass}>
							Búsqueda
						</label>
						<Input
							id='deferred-search'
							name='search'
							value={search}
							placeholder='Documento, empresa, RUT u OC'
							onChange={(event) => onSearchChange(event.target.value)}
						/>
						<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
							La búsqueda se aplica automáticamente.
						</p>
					</div>
					<div>
						<label htmlFor='deferred-status' className={fieldLabelClass}>
							Estado
						</label>
						<SelectReact
							name='status'
							inputId='deferred-status'
							options={statusOptions}
							value={selectedStatus}
							placeholder='Todos'
							isClearable
							onChange={handleStatusChange}
						/>
					</div>
					<div>
						<label htmlFor='due-after' className={fieldLabelClass}>
							Vence desde
						</label>
						<DateInput
							id='due-after'
							name='due_after'
							value={filters.due_after ?? ''}
							placeholder='dd-mm-aaaa'
							onChange={(event) =>
								onChange({ due_after: event.target.value || undefined })
							}
						/>
					</div>
					<div>
						<label htmlFor='due-before' className={fieldLabelClass}>
							Vence hasta
						</label>
						<DateInput
							id='due-before'
							name='due_before'
							value={filters.due_before ?? ''}
							placeholder='dd-mm-aaaa'
							maxYear={dueDateMaxYear}
							maxDate={dueDateMax}
							onChange={(event) =>
								onChange({ due_before: event.target.value || undefined })
							}
						/>
					</div>
					{hasInvalidDateRange && (
						<p className='text-sm font-medium text-red-600 md:col-span-2 xl:col-span-5'>
							“Vence desde” no puede ser posterior a “Vence hasta”. Ajusta el rango
							para consultar documentos.
						</p>
					)}
				</div>
			</CardBody>
		</Card>
	);
};

export default DeferredPaymentsFiltersBar;
