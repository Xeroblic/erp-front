import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '@/components/ui/DataTable/DataTable';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';

export interface PedidoMock {
	id: string;
	rut: string;
	cliente: string;
	canal: string;
	fecha: string;
	cotizacion: boolean;
	link?: string;
	estado: 'Pendiente' | 'Procesando' | 'Completado';
}

interface PedidosTableProps {
	data: PedidoMock[];
	title?: string;
}

const columns: ColumnDef<PedidoMock>[] = [
	{
		accessorKey: 'id',
		header: 'ID Pedido',
		cell: ({ row }) => (
			<span className='font-medium text-zinc-900 dark:text-zinc-100'>
				#{row.getValue('id')}
			</span>
		),
	},
	{
		accessorKey: 'cliente',
		header: 'Cliente',
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				<div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
					{String(row.getValue('cliente')).charAt(0)}
				</div>
				<div className='flex flex-col'>
					<span className='font-medium'>{row.getValue('cliente')}</span>
					<span className='text-xs text-zinc-500'>{row.original.rut}</span>
				</div>
			</div>
		),
	},
	{
		accessorKey: 'canal',
		header: 'Canal',
		cell: ({ row }) => {
			const canal = String(row.getValue('canal'));
			let icon = 'HeroShoppingBag';
			if (canal === 'WhatsApp') icon = 'HeroChatBubbleLeftEllipsis';
			if (canal === 'Correo') icon = 'HeroEnvelope';

			return (
				<div className='flex items-center gap-2 text-zinc-600 dark:text-zinc-400'>
					<Icon icon={icon} className='h-4 w-4' />
					<span>{canal}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'fecha',
		header: 'Fecha',
	},
	{
		id: 'archivos',
		header: 'Respaldo',
		cell: ({ row }) => {
			const hasCotizacion = row.original.cotizacion;
			const hasLink = !!row.original.link;

			return (
				<div className='flex gap-2'>
					{hasCotizacion && (
						<Badge
							color='zinc'
							variant='solid'
							className='flex items-center gap-1 px-2 py-1 text-xs'>
							<Icon icon='HeroDocumentText' className='h-3 w-3' />
							DOC
						</Badge>
					)}
					{hasLink && (
						<Badge
							color='blue'
							variant='solid'
							className='flex items-center gap-1 px-2 py-1 text-xs'>
							<Icon icon='HeroLink' className='h-3 w-3' />
							LINK
						</Badge>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'estado',
		header: 'Estado',
		cell: ({ row }) => {
			const estado = String(row.getValue('estado'));
			let color: 'yellow' | 'blue' | 'emerald' | 'zinc' = 'zinc';

			if (estado === 'Pendiente') color = 'yellow';
			if (estado === 'Procesando') color = 'blue';
			if (estado === 'Completado') color = 'emerald';

			return (
				<Badge color={color} className='px-2.5 py-0.5'>
					{estado}
				</Badge>
			);
		},
	},
];

export default function PedidosTable({ data, title }: PedidosTableProps) {
	return (
		<div className='w-full'>
			{title && (
				<h2 className='mb-6 flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-100'>
					<Icon icon='HeroTableCells' className='h-6 w-6 text-zinc-400' />
					{title}
				</h2>
			)}
			<div className='overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
				<DataTable
					columns={columns}
					data={data}
					searchPlaceholder='Buscar pedido por ID, cliente, canal...'
					emptyMessage='No se encontraron pedidos en esta vista.'
				/>
			</div>
		</div>
	);
}
