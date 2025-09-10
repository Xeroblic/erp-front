/**
 * Tabla de cotizaciones con funcionalidades avanzadas
 * Utiliza TanStack React Table para manejo completo de datos
 * Sigue el mismo patrón de diseño que Sucursales.tsx
 */
import React, { useMemo } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
	getSortedRowModel,
	SortingState,
} from '@tanstack/react-table';
import { IQuote, QuoteStatus } from '../../../../../interface';
import Table, { Th, THead, Tr, TBody, Td } from '../../../../../components/ui/Table';
import Button from '../../../../../components/ui/Button';
import Badge from '../../../../../components/ui/Badge';
import Icon from '../../../../../components/icon/Icon';

interface QuotationsTableProps {
	data: IQuote[];
	loading?: boolean;
	onEdit?: (quotation: IQuote) => void;
	onDelete?: (id: number) => void;
	onDuplicate?: (id: number) => void;
	onView?: (quotation: IQuote) => void;
	onChangeStatus?: (id: number, status: QuoteStatus) => void;
	onConvertToSale?: (id: number) => void;
}

const columnHelper = createColumnHelper<IQuote>();

const QuotationsTable: React.FC<QuotationsTableProps> = ({
	data,
	loading = false,
	onEdit,
	onDelete,
	onDuplicate,
	onView,
	onChangeStatus,
	onConvertToSale,
}) => {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	// Formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	// Formatear fecha
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		});
	};

	// columnas de la tabla
	const columns = [
		columnHelper.accessor('quote_number', {
			header: 'Número',
			cell: (info) => (
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
						<Icon icon='HeroDocumentText' className='text-lg text-primary-600' />
					</div>
					<div>
						<div className='font-medium'>{info.getValue()}</div>
						<div className='text-xs text-zinc-500'>ID: {info.row.original.id}</div>
					</div>
				</div>
			),
		}),
		columnHelper.accessor('quote_date', {
			header: 'Fecha',
			cell: (info) => <span className='text-sm'>{formatDate(info.getValue())}</span>,
		}),
		columnHelper.accessor('valid_until', {
			header: 'Válida Hasta',
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
				const status = info.getValue();
				const getStatusText = (status: QuoteStatus) => {
					switch (status) {
						case 'DRAFT':
							return 'Borrador';
						case 'SENT':
							return 'Enviada';
						case 'APPROVED':
							return 'Aprobada';
						case 'REJECTED':
							return 'Rechazada';
						case 'CONVERTED':
							return 'Convertida';
						case 'EXPIRED':
							return 'Vencida';
						case 'ACCEPTED':
							return 'Aceptada';
						case 'WAITING':
							return 'En Espera';
						case 'CREDIT_30':
							return 'Crédito 30d';
						case 'PAID':
							return 'Pagada';
						default:
							return status;
					}
				};

				return <span className='text-sm'>{getStatusText(status)}</span>;
			},
		}),
		columnHelper.accessor('total_amount', {
			header: 'Total',
			cell: (info) => <span className='font-medium'>{formatCurrency(info.getValue())}</span>,
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: (info) => (
				<div className='flex justify-end gap-2'>
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
					<Button
						variant='outline'
						size='sm'
						icon='HeroDocumentDuplicate'
						onClick={() => onDuplicate?.(info.row.original.id)}
						className='p-1'
					/>
					{info.row.original.status === 'APPROVED' && info.row.original.can_convert && (
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
	];

	const table = useReactTable({
		data,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	if (loading) {
		return (
			<div className='p-8 text-center'>
				<div className='flex items-center justify-center gap-3'>
					<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
					<span className='text-zinc-600'>Cargando cotizaciones...</span>
				</div>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 text-center'>
				<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
					<Icon icon='HeroDocumentText' className='text-2xl text-zinc-400' />
				</div>
				<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
					No hay cotizaciones
				</h3>
				<p className='mb-4 max-w-sm text-sm text-zinc-500'>
					Comienza creando una nueva cotización para gestionar tus ventas.
				</p>
			</div>
		);
	}

	return (
		<Table className='w-full table-fixed'>
			<THead>
				{table.getHeaderGroups().map((hg) => (
					<Tr key={hg.id}>
						{hg.headers.map((header) => (
							<Th key={header.id} className='text-left'>
								{header.isPlaceholder
									? null
									: flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
							</Th>
						))}
					</Tr>
				))}
			</THead>
			<TBody>
				{table.getRowModel().rows.map((row) => (
					<Tr key={row.id}>
						{row.getVisibleCells().map((cell) => (
							<Td key={cell.id}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</Td>
						))}
					</Tr>
				))}
			</TBody>
		</Table>
	);
};

export default QuotationsTable;
