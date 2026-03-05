import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import DataTable from '@/components/ui/DataTable';

interface EnlaceMock {
	id: string;
	hash: string;
	vendedor: string;
	fechaCreacion: string;
	solicitudes: number;
	estado: 'Activo' | 'Inactivo';
}

const mockEnlaces: EnlaceMock[] = [
	{
		id: '1',
		hash: 'user-123',
		vendedor: 'Juan Perez (Tu)',
		fechaCreacion: '2023-10-20',
		solicitudes: 5,
		estado: 'Activo',
	},
	{
		id: '2',
		hash: 'ext-mario-89',
		vendedor: 'Mario Practicante',
		fechaCreacion: '2023-10-22',
		solicitudes: 12,
		estado: 'Activo',
	},
	{
		id: '3',
		hash: 'cyber-ventas-23',
		vendedor: 'Campaña Cyber',
		fechaCreacion: '2023-09-01',
		solicitudes: 45,
		estado: 'Inactivo',
	},
];

export default function EnlacesPublicosPage() {
	const navigate = useNavigate();

	const columns: ColumnDef<EnlaceMock>[] = [
		{
			accessorKey: 'hash',
			header: 'Identificador / Hash',
			cell: ({ row }) => (
				<div className='flex flex-col'>
					<span className='font-semibold text-zinc-900 dark:text-zinc-100'>
						{row.getValue('hash')}
					</span>
					<span className='text-xs text-zinc-500'>
						/portal-pedidos/{row.getValue('hash')}
					</span>
				</div>
			),
		},
		{
			accessorKey: 'vendedor',
			header: 'Vendedor / Origen',
		},
		{
			accessorKey: 'fechaCreacion',
			header: 'Generado El',
		},
		{
			accessorKey: 'solicitudes',
			header: 'Volumen',
			cell: ({ row }) => (
				<Badge color='blue' variant='outline'>
					{row.getValue('solicitudes')} peticiones
				</Badge>
			),
		},
		{
			accessorKey: 'estado',
			header: 'Estado',
			cell: ({ row }) => {
				const estado = row.getValue('estado') as string;
				return <Badge color={estado === 'Activo' ? 'emerald' : 'zinc'}>{estado}</Badge>;
			},
		},
		{
			id: 'acciones',
			header: 'Acciones',
			cell: ({ row }) => (
				<div className='flex gap-2'>
					<Button
						variant='outline'
						color='zinc'
						size='sm'
						icon='HeroClipboardCopy'
						onClick={() => {
							navigator.clipboard.writeText(
								`${window.location.origin}/portal-pedidos/${row.original.hash}`,
							);
						}}>
						Copiar URL
					</Button>
					<Button
						variant='solid'
						color='emerald'
						size='sm'
						icon='HeroArrowRight'
						onClick={() =>
							navigate(`/comercial/enlaces/${row.original.hash}/solicitudes`)
						}>
						Ver Solicitudes
					</Button>
				</div>
			),
		},
	];

	return (
		<PageWrapper title='Enlaces Públicos (Ventas)' name='Enlaces Públicos'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'>
							<Icon icon='DuoShare' className='h-6 w-6' />
						</div>
						<div>
							<h2 className='text-xl font-bold text-zinc-900 dark:text-zinc-100'>
								Gestión de Enlaces Públicos
							</h2>
							<p className='text-sm text-zinc-500 dark:text-zinc-400'>
								Administra los enlaces de captura "Buffer" para personal externo.
							</p>
						</div>
					</div>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<Card className='w-full'>
					<CardBody>
						<div className='mb-4 flex justify-end'>
							<Button variant='solid' color='emerald' icon='HeroPlus'>
								Generar Nuevo Enlace
							</Button>
						</div>
						<DataTable
							columns={columns}
							data={mockEnlaces}
							searchPlaceholder='Buscar enlace...'
						/>
					</CardBody>
				</Card>
			</Container>
		</PageWrapper>
	);
}
