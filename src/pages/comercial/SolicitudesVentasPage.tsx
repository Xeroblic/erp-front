import React, { useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import OffCanvas, { OffCanvasBody, OffCanvasHeader } from '@/components/ui/OffCanvas';
import Label from '@/components/form/Label';
import Input from '@/components/form/Input';
import SelectReact from '@/components/form/SelectReact';

interface PortalRequestMock {
	id: string;
	vendedorId: string;
	cliente: string;
	rut: string;
	fecha: string;
	estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
	cotizacion: boolean;
	link?: string;
}

const mockRequests: PortalRequestMock[] = [
	{
		id: '1001',
		vendedorId: 'VEND-012',
		cliente: 'Juan Pérez',
		rut: '11.222.333-4',
		fecha: '2023-10-25',
		estado: 'Pendiente',
		cotizacion: true,
	},
	{
		id: '1002',
		vendedorId: 'VEND-045',
		cliente: 'Empresa ABC SpA',
		rut: '76.123.456-7',
		fecha: '2023-10-24',
		estado: 'Pendiente',
		cotizacion: false,
		link: 'https://docs.google.com/...',
	},
];

export default function SolicitudesVentasPage() {
	const [selectedRequest, setSelectedRequest] = useState<PortalRequestMock | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const handleOpenDrawer = (request: PortalRequestMock) => {
		setSelectedRequest(request);
		setIsDrawerOpen(true);
	};

	const columns: ColumnDef<PortalRequestMock>[] = [
		{
			accessorKey: 'id',
			header: 'ID',
			cell: ({ row }) => (
				<span className='font-medium text-emerald-600'>#{row.getValue('id')}</span>
			),
		},
		{
			accessorKey: 'vendedorId',
			header: 'ID Vendedor',
		},
		{
			accessorKey: 'cliente',
			header: 'Cliente',
			cell: ({ row }) => (
				<div className='flex flex-col'>
					<span className='font-semibold text-zinc-900 dark:text-zinc-100'>
						{row.getValue('cliente')}
					</span>
					<span className='text-xs text-zinc-500'>{row.original.rut}</span>
				</div>
			),
		},
		{
			accessorKey: 'fecha',
			header: 'Fecha Ingreso',
		},
		{
			id: 'archivos',
			header: 'Respaldo',
			cell: ({ row }) => {
				return (
					<div className='flex gap-2'>
						{row.original.cotizacion && (
							<Badge color='zinc' variant='solid' className='px-2 py-0.5 text-xs'>
								<Icon
									icon='HeroDocumentText'
									className='mr-1 inline-block h-3 w-3'
								/>{' '}
								DOC
							</Badge>
						)}
						{row.original.link && (
							<Badge color='blue' variant='solid' className='px-2 py-0.5 text-xs'>
								<Icon icon='HeroLink' className='mr-1 inline-block h-3 w-3' /> LINK
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
				const estado = row.getValue('estado') as string;
				let color: 'yellow' | 'emerald' | 'red' = 'yellow';
				if (estado === 'Aprobado') color = 'emerald';
				if (estado === 'Rechazado') color = 'red';

				return <Badge color={color}>{estado}</Badge>;
			},
		},
		{
			id: 'acciones',
			header: 'Acciones',
			cell: ({ row }) => (
				<Button
					variant='outline'
					color='zinc'
					size='sm'
					icon='HeroEye'
					onClick={() => handleOpenDrawer(row.original)}>
					Revisar
				</Button>
			),
		},
	];

	return (
		<PageWrapper title='Solicitudes de Ventas (Portal)' name='Solicitudes'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'>
							<Icon icon='HeroInboxArrowDown' className='text-xl' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
								Solicitudes de Ventas
							</h2>
							<p className='text-sm text-zinc-500'>
								Bandeja de entrada de las solicitudes generadas a través del Portal
								de Pedidos.
							</p>
						</div>
					</div>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<Card className='w-full'>
					<CardBody>
						<DataTable
							columns={columns}
							data={mockRequests}
							searchPlaceholder='Buscar por cliente, vendedor o ID...'
						/>
					</CardBody>
				</Card>

				{/* OffCanvas para revisión de Solicitud */}
				<OffCanvas isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen}>
					<OffCanvasHeader className='border-b border-zinc-200 dark:border-zinc-800'>
						<div className='flex flex-col gap-1'>
							<h3 className='text-lg font-bold text-emerald-700 dark:text-emerald-400'>
								Revisión de Solicitud #{selectedRequest?.id}
							</h3>
							<p className='text-sm text-zinc-500'>
								Cliente: <strong>{selectedRequest?.cliente}</strong>
							</p>
						</div>
					</OffCanvasHeader>
					<OffCanvasBody className='p-6'>
						<div className='flex flex-col space-y-6'>
							{/* Fila Asignar Agente */}
							<div>
								<Label htmlFor='asignado'>Agente / Vendedor Asignado</Label>
								<SelectReact
									id='asignado'
									name='asignado'
									options={[
										{ value: 'vend1', label: 'VEND-012 | Juan Perez (Tu)' },
										{ value: 'vend2', label: 'VEND-045 | Maria Gonzalez' },
									]}
									placeholder='Selecciona vendedor a cargo...'
									className='mt-2'
								/>
							</div>

							{/* Comentarios */}
							<div>
								<Label htmlFor='comentarios'>Comentarios / Observaciones</Label>
								<textarea
									id='comentarios'
									className='mt-2 block w-full rounded-md border-zinc-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:text-sm'
									rows={4}
									placeholder='Notas internas sobre el estado de la venta...'
								/>
							</div>

							{/* Link del Ticket */}
							<div>
								<Label htmlFor='enlace'>Enlace Ticket/Venta Creada</Label>
								<Input
									id='enlace'
									name='enlace'
									placeholder='https://erp.com/ventas/view/...'
									className='mt-2'
								/>
							</div>

							<div className='mt-4 flex justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800'>
								<Button
									color='zinc'
									variant='outline'
									onClick={() => setIsDrawerOpen(false)}
									className='flex-1'>
									Cancelar
								</Button>
								<Button
									color='emerald'
									variant='solid'
									icon='HeroCheck'
									onClick={() => setIsDrawerOpen(false)}
									className='flex-1'>
									Aprobar Venta
								</Button>
							</div>
						</div>
					</OffCanvasBody>
				</OffCanvas>
			</Container>
		</PageWrapper>
	);
}
