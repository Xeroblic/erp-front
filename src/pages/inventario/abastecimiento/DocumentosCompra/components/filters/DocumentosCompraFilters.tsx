import React from 'react';
import type { MultiValue, SingleValue } from 'react-select';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
	TDocumentReceptionStatusFilter,
	TDocumentStatusFilter,
	TDocumentTypeFilter,
} from '../../types';

/** Ninguno de estos selects es `isMulti`, pero `SelectReact` tipa el `onChange` genérico. */
const isMultiValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
): value is MultiValue<TSelectOption> => Array.isArray(value);

const singleSelectValue = (
	value: SingleValue<TSelectOption> | MultiValue<TSelectOption> | null,
): TSelectOption | null => {
	if (value === null) return null;
	return isMultiValue(value) ? (value[0] ?? null) : value;
};

/**
 * Mismo criterio que el «Estado» de pagos diferidos: «Todos»/«Todas» no es
 * una opción más de la lista (se vería negra, como cualquier selección real);
 * es la ausencia de selección — `value=null`, texto de `placeholder` (gris) y
 * `isClearable` para volver a ese estado con la X.
 */
const withoutAllOption = <TValue extends string>(
	options: { value: TValue | 'all'; label: string }[],
): TSelectOption[] =>
	options
		.filter((option): option is { value: TValue; label: string } => option.value !== 'all')
		.map((option) => ({ value: option.value, label: option.label }));

const allOptionLabel = (options: { value: string; label: string }[], fallback: string): string =>
	options.find((option) => option.value === 'all')?.label ?? fallback;

interface IDocumentosCompraFiltersProps {
	search: string;
	onSearchChange: (value: string) => void;
	documentType: TDocumentTypeFilter;
	documentTypeOptions: { value: TDocumentTypeFilter; label: string }[];
	onDocumentTypeChange: (value: TDocumentTypeFilter) => void;
	status: TDocumentStatusFilter;
	statusOptions: { value: TDocumentStatusFilter; label: string }[];
	onStatusChange: (value: TDocumentStatusFilter) => void;
	receptionStatus: TDocumentReceptionStatusFilter;
	receptionStatusOptions: { value: TDocumentReceptionStatusFilter; label: string }[];
	onReceptionStatusChange: (value: TDocumentReceptionStatusFilter) => void;
	issuedFrom: string;
	onIssuedFromChange: (value: string) => void;
	issuedTo: string;
	onIssuedToChange: (value: string) => void;
	onClearFilters: () => void;
}

const fieldLabelClass = 'block text-sm font-medium text-zinc-700 dark:text-zinc-300';
const selectBackgroundClass = '!bg-zinc-50 dark:!bg-zinc-900';

const DocumentosCompraFilters: React.FC<IDocumentosCompraFiltersProps> = ({
	search,
	onSearchChange,
	documentType,
	documentTypeOptions,
	onDocumentTypeChange,
	status,
	statusOptions,
	onStatusChange,
	receptionStatus,
	receptionStatusOptions,
	onReceptionStatusChange,
	issuedFrom,
	onIssuedFromChange,
	issuedTo,
	onIssuedToChange,
	onClearFilters,
}) => {
	const documentTypeSelectOptions = withoutAllOption(documentTypeOptions);
	const statusSelectOptions = withoutAllOption(statusOptions);
	const receptionStatusSelectOptions = withoutAllOption(receptionStatusOptions);

	return (
		<Card>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Icon icon='DuoFilter' size='text-xl' />
					<CardTitle className='text-lg'>Filtros</CardTitle>
				</div>
				<Button variant='outline' size='sm' icon='HeroXMark' onClick={onClearFilters}>
					Limpiar
				</Button>
			</CardHeader>
			<CardBody>
				<div className='grid grid-cols-1 gap-4 rounded-lg bg-zinc-50/80 p-4 dark:bg-zinc-900/30 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
					<div className='space-y-1 xl:col-span-2'>
						<label htmlFor='documentos-compra-search' className={fieldLabelClass}>
							Búsqueda
						</label>
						<Input
							id='documentos-compra-search'
							name='search'
							value={search}
							placeholder='Folio, proveedor o RUT'
							onChange={(event) => onSearchChange(event.target.value)}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='documentos-compra-type' className={fieldLabelClass}>
							Tipo
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='documentos-compra-type'
							name='document_type'
							options={documentTypeSelectOptions}
							value={
								documentTypeSelectOptions.find(
									(option) => option.value === documentType,
								) ?? null
							}
							placeholder={allOptionLabel(documentTypeOptions, 'Todos')}
							isClearable
							onChange={(selected) =>
								onDocumentTypeChange(
									(singleSelectValue(selected)?.value ??
										'all') as TDocumentTypeFilter,
								)
							}
						/>
					</div>
					<div className='space-y-1'>
						<label htmlFor='documentos-compra-status' className={fieldLabelClass}>
							Estado
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='documentos-compra-status'
							name='status'
							options={statusSelectOptions}
							value={
								statusSelectOptions.find((option) => option.value === status) ??
								null
							}
							placeholder={allOptionLabel(statusOptions, 'Todos')}
							isClearable
							onChange={(selected) =>
								onStatusChange(
									(singleSelectValue(selected)?.value ??
										'all') as TDocumentStatusFilter,
								)
							}
						/>
					</div>
					<div className='space-y-1'>
						<label
							htmlFor='documentos-compra-reception-status'
							className={fieldLabelClass}>
							Cobertura
						</label>
						<SelectReact
							className={selectBackgroundClass}
							inputId='documentos-compra-reception-status'
							name='reception_status'
							options={receptionStatusSelectOptions}
							value={
								receptionStatusSelectOptions.find(
									(option) => option.value === receptionStatus,
								) ?? null
							}
							placeholder={allOptionLabel(receptionStatusOptions, 'Todas')}
							isClearable
							onChange={(selected) =>
								onReceptionStatusChange(
									(singleSelectValue(selected)?.value ??
										'all') as TDocumentReceptionStatusFilter,
								)
							}
						/>
					</div>
					{/* Un solo ítem del grid exterior, a todo el ancho: si «desde» y
					    «hasta» compitieran por una sola columna del grid exterior
					    quedaban demasiado angostos; a todo el ancho pasan juntos a su
					    propia fila con espacio real para el DateInput. */}
					<div className='col-span-full grid grid-cols-2 gap-3 sm:max-w-md'>
						<div className='space-y-1'>
							<label
								htmlFor='documentos-compra-issued-from'
								className={fieldLabelClass}>
								Emisión desde
							</label>
							<DateInput
								commitOnComplete
								id='documentos-compra-issued-from'
								name='issued_from'
								value={issuedFrom}
								onChange={(event) => onIssuedFromChange(event.target.value)}
							/>
						</div>
						<div className='space-y-1'>
							<label
								htmlFor='documentos-compra-issued-to'
								className={fieldLabelClass}>
								Emisión hasta
							</label>
							<DateInput
								commitOnComplete
								id='documentos-compra-issued-to'
								name='issued_to'
								value={issuedTo}
								onChange={(event) => onIssuedToChange(event.target.value)}
							/>
						</div>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default DocumentosCompraFilters;
