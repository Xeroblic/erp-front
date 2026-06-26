/**
 * Tabla de cotizaciones con funcionalidades avanzadas
 * Utiliza TanStack React Table para manejo completo de datos
 * Sigue el mismo patrón de diseño que Sucursales.tsx
 */
import React, { useMemo } from 'react';
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { IQuote, QuoteStatus } from '@/interface';
import DataTable from '@/components/ui/DataTable/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import { getQuoteStatusBadge, normalizeQuoteStatusValue } from '../../constants/quoteStatuses';
import { formatDate } from '@/utils/format.utils';
import Tooltip from '@/components/ui/Tooltip';

interface QuotationsTableProps {
	data: IQuote[];
	loading?: boolean;
	pageSize?: number;
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
	pageSize,
	onEdit,
	onDelete,
	// onDuplicate,
	onView,
	onChangeStatus,
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

	// columnas de la tabla
	const columns = useMemo<ColumnDef<IQuote, any>[]>(
		() => [
			columnHelper.accessor('id', {
				enableSorting: true,
				sortDescFirst: true,
				header: 'N° de Cotización',
				cell: (info) => <span className='text-sm'>{info.getValue() || '—'}</span>,
			}),
			columnHelper.accessor('customer.name', {
				header: 'Cliente',
				cell: (info) => {
					const customerName = info.getValue();
					return (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroUser' className='text-xs text-zinc-400' />
							<span className='text-sm'>{customerName}</span>
						</div>
					);
				},
			}),
			columnHelper.accessor('quote_date', {
				header: 'Fecha',
				cell: (info) => <span className='text-sm'>{formatDate(info.getValue())}</span>,
			}),
			columnHelper.accessor((row) => row.expiry_date || (row as any).valid_until, {
				header: 'Válida Hasta',
				id: 'expiry_date',
				cell: (info) => <span className='text-sm'>{formatDate(info.getValue())}</span>,
			}),
			columnHelper.accessor('status', {
				header: 'Estado',
				cell: (info) => {
					const badge = getQuoteStatusBadge(info.getValue());
					return (
						<Badge variant={'outline'} color={badge.color} className='px-2 text-md'>
							{badge.label}
						</Badge>
					);
				},
			}),
			columnHelper.accessor('total_amount', {
				header: 'Total',
				cell: (info) => {
					const value = info.getValue();
					const amount =
						typeof value === 'number'
							? Math.floor(value)
							: Math.floor(Number(value ?? 0));
					return <span className='font-medium'>{formatCurrency(amount)}</span>;
				},
			}),
			columnHelper.display({
				id: 'acciones',
				header: 'Acciones',
				cell: (info) => (
					<div className='flex justify-end gap-2'>
						<Tooltip text='Descargar PDF' placement='top-end'>
							<Button
								variant='outline'
								size='sm'
								icon='HeroArrowDownTray'
								onClick={() => onDownloadPdf?.(info.row.original.id)}
								className='bg-sky-400/30 p-1'
								color='sky'
							/>
						</Tooltip>
						<Tooltip text='Ver Cotización' placement='top-end'>
							<Button
								variant='outline'
								size='sm'
								icon='HeroEye'
								color='violet'
								onClick={() => onView?.(info.row.original)}
								className='bg-violet-400/20 p-1'
								/>
						</Tooltip>
						{['draft'].includes(
							normalizeQuoteStatusValue(info.row.original.status)
						) && (
							<Tooltip text='Enviar cotizacion'>
								<Button
									variant='outline'
									size='sm'
									icon='HeroPaperAirplane'
									color='zinc'
									onClick={() => onChangeStatus?.(info.row.original.id, 'sent')}
									className='bg-zinc-400/20 p-1'
									/>
							</Tooltip>
						)}
						{['approved'].includes(
							normalizeQuoteStatusValue(info.row.original.status)
						) && (
								<Tooltip text='Convertir a venta' placement='top-end'>
									<Button
										variant='outline'
										size='sm'
										color='emerald'
										onClick={() => onConvertToSale?.(info.row.original.id)}
										className='bg-emerald-300/20 p-1'
									>
										<Icon icon='HeroBolt' color={'emerald'} className='text-lg' />
									</Button>
								</Tooltip>
							)}
						{['draft', 'expired', 'rejected'].includes(
							normalizeQuoteStatusValue(info.row.original.status),
						) && (
							<>
								<Tooltip text='Editar' placement='top-end'>
									<Button
										variant='outline'
										size='sm'
										icon='HeroPencil'
										color='zinc'
										onClick={() => onEdit?.(info.row.original)}
										className='bg-zinc-400/20 p-1'
										/>
								</Tooltip>
								<Tooltip text='Eliminar' placement='top-end'>
									<Button
										variant='outline'
										size='sm'
										color='red'
										onClick={() => onDelete?.(info.row.original.id)}
										className='bg-red-400/30 p-0'>
										<Icon icon='HeroTrash' color={'red'} className='text-lg' />
									</Button>
								</Tooltip>
							</>
						)}
					</div>
				),
			}),
		],
		[onDownloadPdf, onView, onEdit, onChangeStatus, onConvertToSale, onDelete],
	);

	return (
		<DataTable<IQuote>
			columns={columns}
			data={data}
			pageSize={pageSize}
			initialSortingState={[{ id: 'id', desc: true }]}
			loading={loading}
			emptyMessage='No hay cotizaciones'
			searchPlaceholder='Buscar cotización...'
		/>
	);
};

export default QuotationsTable;
