import React, { useState } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import Table, { TBody, THead, Tr, Th, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import SubsidiaryModal from './SubsidiaryModal';
import { ISubempresa } from '@/interface/empresas.interface';
import { useNavigate } from 'react-router-dom';

interface SubsidiariesTableProps {
	subsidiaries: ISubempresa[];
	loading: boolean;
	onRefresh: () => void;
}

const columnHelper = createColumnHelper<ISubempresa>();

export default function SubsidiariesTable({
	subsidiaries,
	loading,
	onRefresh,
}: SubsidiariesTableProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSubsidiary, setEditingSubsidiary] = useState<ISubempresa | null>(null);
	const navigate = useNavigate();

	const handleEdit = (subsidiary: ISubempresa) => {
		setEditingSubsidiary(subsidiary);
		setIsModalOpen(true);
	};

	const handleCreate = () => {
		setEditingSubsidiary(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingSubsidiary(null);
	};

	const handleSuccess = () => {
		handleCloseModal();
		onRefresh();
	};

	// Definir las columnas con TanStack Table
	const columns = [
		columnHelper.display({
			id: 'nombre',
			header: 'Nombre',
			cell: (info) => {
				const subsidiary = info.row.original;
				// Mapear correctamente desde los campos subsidiary_*
				const name = subsidiary.subsidiary_name || subsidiary.name || 'Sin nombre';

				return (
					<div className='flex min-w-[200px] items-center gap-2'>
						<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100'>
							<Icon
								icon='HeroBuildingStorefront'
								className='text-sm text-primary-600'
							/>
						</div>
						<div className='min-w-0'>
							<div className='truncate font-medium'>{name}</div>
							<div className='text-xs text-zinc-500'>ID: {subsidiary.id}</div>
						</div>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'rut',
			header: 'RUT',
			cell: (info) => {
				const subsidiary = info.row.original;
				const rut = subsidiary.subsidiary_rut || subsidiary.rut;

				return rut ? (
					<span className='font-mono text-sm'>{rut}</span>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin RUT
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'direccion',
			header: 'Dirección',
			cell: (info) => {
				const subsidiary = info.row.original;
				const address = subsidiary.subsidiary_address || subsidiary.address;

				return (
					<div className='max-w-xs'>
						{address ? (
							<span className='text-sm'>{address}</span>
						) : (
							<Badge variant='outline' className='text-zinc-400'>
								Sin dirección
							</Badge>
						)}
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'telefono',
			header: 'Teléfono',
			cell: (info) => {
				const subsidiary = info.row.original;
				const phone = subsidiary.subsidiary_phone || subsidiary.phone;

				return phone ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroPhone' className='text-xs text-zinc-400' />
						<span className='text-sm'>{phone}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin teléfono
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'email',
			header: 'Email',
			cell: (info) => {
				const subsidiary = info.row.original;
				const email = subsidiary.subsidiary_email || subsidiary.email;

				return email ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroEnvelope' className='text-xs text-zinc-400' />
						<span className='max-w-[200px] truncate text-sm'>{email}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin email
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'sucursales',
			header: 'Sucursales',
			cell: (info) => {
				const subsidiary = info.row.original;
				const count =
					subsidiary.branches_count ||
					subsidiary.sucursales?.length ||
					subsidiary.branches?.length ||
					0;

				return (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroBuildingOffice' className='text-xs text-zinc-400' />
						<span className='text-sm'>{count}</span>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'comuna',
			header: 'Comuna',
			cell: (info) => {
				const subsidiary = info.row.original;
				const communeName = (subsidiary as any)?.commune?.name;

				return communeName ? (
					<div className='flex items-center gap-1'>
						<Icon icon='HeroMap' className='text-xs text-zinc-400' />
						<span className='text-sm'>{communeName}</span>
					</div>
				) : (
					<Badge variant='outline' className='text-zinc-400'>
						Sin comuna
					</Badge>
				);
			},
		}),
		columnHelper.display({
			id: 'acciones',
			header: 'Acciones',
			cell: (info) => {
				const subsidiary = info.row.original;

				return (
					<div className='flex gap-1'>
						<Button
							variant='outline'
							size='sm'
							icon='HeroPencil'
							onClick={() => handleEdit(subsidiary)}
							className='p-1'
							title='Editar subempresa'
						/>
						<Button
							variant='outline'
							size='sm'
							icon='HeroEye'
							className='p-1'
							onClick={() => navigate(`/gestion/subempresa/${subsidiary.id}`)}
							title='Ver detalles'
						/>
					</div>
				);
			},
		}),
	];

	// Crear la instancia de la tabla
	const table = useReactTable({
		data: subsidiaries,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (loading) {
		return (
			<Card>
				<CardBody>
					<div className='flex items-center justify-center py-12'>
						<div className='flex items-center gap-3'>
							<div className='h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent'></div>
							<span className='text-zinc-600'>Cargando subempresas...</span>
						</div>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader className='flex flex-row items-center justify-between'>
					<div className='flex items-center gap-2'>
						<Icon icon='HeroBuildingStorefront' className='text-xl' />
						<div>
							<h3 className='font-semibold'>Subempresas</h3>
							<p className='text-sm text-zinc-500'>
								{subsidiaries.length} subempresa
								{subsidiaries.length !== 1 ? 's' : ''} registrada
								{subsidiaries.length !== 1 ? 's' : ''}
							</p>
						</div>
					</div>
					<div className='flex gap-2'>
						<Button
							variant='outline'
							icon='HeroArrowPath'
							onClick={onRefresh}
							size='sm'>
							Actualizar
						</Button>
						<Button variant='solid' icon='HeroPlus' onClick={handleCreate} size='sm'>
							Nueva Subempresa
						</Button>
					</div>
				</CardHeader>

				<CardBody className='p-0'>
					{subsidiaries.length > 0 ? (
						<div className='overflow-x-auto'>
							<Table>
								<THead>
									{table.getHeaderGroups().map((headerGroup) => (
										<Tr key={headerGroup.id}>
											{headerGroup.headers.map((header) => (
												<Th key={header.id}>
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
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</Td>
											))}
										</Tr>
									))}
								</TBody>
							</Table>
						</div>
					) : (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
								<Icon
									icon='HeroBuildingStorefront'
									className='text-2xl text-zinc-400'
								/>
							</div>
							<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
								No hay subempresas registradas
							</h3>
							<p className='mb-4 max-w-sm text-sm text-zinc-500'>
								Comienza agregando tu primera subempresa para organizar mejor tu
								estructura empresarial.
							</p>
							<Button
								variant='solid'
								icon='HeroPlus'
								onClick={handleCreate}
								size='sm'>
								Crear Primera Subempresa
							</Button>
						</div>
					)}
				</CardBody>
			</Card>

			<SubsidiaryModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				subsidiary={editingSubsidiary}
				onSuccess={handleSuccess}
			/>
		</>
	);
}
