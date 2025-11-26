/**
 * Tabla de cotizaciones con funcionalidades avanzadas
 * Utiliza TanStack React Table para manejo completo de datos
 * Sigue el mismo patrón de diseño que Sucursales.tsx
 */
import React, { useMemo } from 'react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { IQuote, QuoteStatus } from '../../../../../interface';
import DataTable from '@/components/ui/DataTable/DataTable';
import Button from '../../../../../components/ui/Button';
import Badge from '../../../../../components/ui/Badge';
import Icon from '../../../../../components/icon/Icon';
import { getQuoteStatusBadge, normalizeQuoteStatusValue } from '../../constants/quoteStatuses';

interface QuotationsTableProps {
	data: IQuote[];
	loading?: boolean;
	onEdit?: (quotation: IQuote) => void;
	onDelete?: (id: number) => void;
	onDuplicate?: (id: number) => void;
	onView?: (quotation: IQuote) => void;
	onChangeStatus?: (id: number, status: QuoteStatus) => void;
	onConvertToSale?: (id: number) => void;
	onDownloadPdf?: (id: number) => void;
}

const columnHelper = createColumnHelper<IQuote>();

const QuotationsTable: React.FC<QuotationsTableProps> = ({
	data,
	loading = false,
	onEdit,
	onDelete,
	// onDuplicate,
	onView,
	// onChangeStatus,
	onConvertToSale,
	onDownloadPdf,
}) => {
	// Formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	// Formatear fecha
	const formatDate = (value?: string | null) => {
		if (!value) return '—';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return '—';
		return date.toLocaleDateString('es-CL', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	};

	// columnas de la tabla
	const columns = useMemo<ColumnDef<IQuote, any>[]>(() => [
		columnHelper.accessor('quote_date', {
			header: 'Fecha',
			cell: (info) => <span className='text-sm'>{formatDate(info.getValue())}</span>,
		}),
		columnHelper.accessor((row) => row.expiry_date || (row as any).valid_until, {
			header: 'Válida Hasta',
			id: 'expiry_date',
			cell: (info) => <span className='text-sm'>{formatDate(info.getValue())}</span>,
		}),
		columnHelper.accessor('customer_id', {
			header: 'Cliente',
			cell: (info) => {
				const customerId = info.getValue();
				return (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroUser' className='text-xs text-zinc-400' />
						<span className='text-sm'>Cliente #{customerId}</span>
					</div>
				);
			},
		}),
		columnHelper.accessor('status', {
			header: 'Estado',
			cell: (info) => {
				const badge = getQuoteStatusBadge(info.getValue());
				return (
					<Badge variant={badge.variant} className='text-xs'>
						{badge.label}
					</Badge>
				);
			},
		}),
		columnHelper.accessor('total_amount', {
			header: 'Total',
			cell: (info) => {
				const value = info.getValue();

				const amount = typeof value === 'number' ? value : Number(value ?? 0);

				return <span className='font-medium'>{formatCurrency(amount)}</span>;
			},
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: (info) => (
				<div className='flex justify-end gap-2'>
					<Button
						variant='outline'
						size='sm'
						icon='HeroArrowDownTray'
						onClick={() => onDownloadPdf?.(info.row.original.id)}
						className='p-1'
						title='Descargar PDF'
					/>
					<Button
						variant='outline'
						size='sm'
						icon='HeroEye'
						onClick={() => onView?.(info.row.original)}
						className='p-1'
					/>
					<Button
						variant='outline'
						size='sm'
						icon='HeroPencil'
						onClick={() => onEdit?.(info.row.original)}
						className='p-1'
					/>
					{normalizeQuoteStatusValue(info.row.original.status) === 'approved' &&
						info.row.original.can_convert && (
							<Button
								variant='outline'
								size='sm'
								icon='HeroBolt'
								onClick={() => onConvertToSale?.(info.row.original.id)}
								className='p-1'
								title='Convertir a venta'
							/>
						)}
					<Button
						variant='solid'
						size='sm'
						icon='HeroTrash'
						color='red'
						onClick={() => onDelete?.(info.row.original.id)}
						className='p-1'
					/>
				</div>
			),
		}),
	], [onDownloadPdf, onView, onEdit, onConvertToSale, onDelete]);

	return (
		<DataTable<IQuote>
			columns={columns}
			data={data}
			loading={loading}
			emptyMessage='No hay cotizaciones'
			searchPlaceholder='Buscar cotización...'
		/>
	);
};

export default QuotationsTable;
