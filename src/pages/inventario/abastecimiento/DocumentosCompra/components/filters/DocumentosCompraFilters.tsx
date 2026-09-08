import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
	TDocumentReceptionStatusFilter,
	TDocumentStatusFilter,
	TDocumentTypeFilter,
} from '../../types';

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
}) => (
	<Card>
		<CardHeader>
			<div className='flex items-center gap-2'>
				<Icon icon='DuoFilter' size='text-xl' />
				<CardTitle className='text-lg'>Filtros</CardTitle>
			</div>
			<Button variant='outline' size='sm' icon='HeroXMark' onClick={onClearFilters}>
				Limpiar filtros
			</Button>
		</CardHeader>
		<CardBody>
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
				<div className='space-y-1 xl:col-span-2'>
					<label
						htmlFor='documentos-compra-search'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
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
					<label
						htmlFor='documentos-compra-type'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Tipo
					</label>
					<Select
						id='documentos-compra-type'
						name='document_type'
						value={documentType}
						onChange={(event) =>
							onDocumentTypeChange(event.target.value as TDocumentTypeFilter)
						}>
						{documentTypeOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='documentos-compra-status'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Estado
					</label>
					<Select
						id='documentos-compra-status'
						name='status'
						value={status}
						onChange={(event) =>
							onStatusChange(event.target.value as TDocumentStatusFilter)
						}>
						{statusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='documentos-compra-reception-status'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Cobertura
					</label>
					<Select
						id='documentos-compra-reception-status'
						name='reception_status'
						value={receptionStatus}
						onChange={(event) =>
							onReceptionStatusChange(
								event.target.value as TDocumentReceptionStatusFilter,
							)
						}>
						{receptionStatusOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='documentos-compra-issued-from'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Emisión desde
					</label>
					<Input
						id='documentos-compra-issued-from'
						name='issued_from'
						type='date'
						value={issuedFrom}
						onChange={(event) => onIssuedFromChange(event.target.value)}
					/>
				</div>
				<div className='space-y-1'>
					<label
						htmlFor='documentos-compra-issued-to'
						className='block text-sm font-medium text-zinc-700 dark:text-zinc-300'>
						Emisión hasta
					</label>
					<Input
						id='documentos-compra-issued-to'
						name='issued_to'
						type='date'
						value={issuedTo}
						onChange={(event) => onIssuedToChange(event.target.value)}
					/>
				</div>
			</div>
		</CardBody>
	</Card>
);

export default DocumentosCompraFilters;
