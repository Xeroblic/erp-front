import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { Th, THead, Tr, TBody, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import Spinner from '@/components/ui/Spinner';
import { ISubempresa } from '@/interface/empresas.interface';

const columnHelper = createColumnHelper<ISubempresa>();

interface SubempresasTableProps {
	subempresas: ISubempresa[];
	loading: boolean;
	onEdit: (subempresa: ISubempresa) => void;
	onDelete: (id: number) => void;
	onCreate: () => void;
}

export default function SubempresasTable({
	subempresas,
	loading,
	onEdit,
	onDelete,
	onCreate,
}: SubempresasTableProps) {
	const navigate = useNavigate();
	const [sorting, setSorting] = useState<SortingState>([]);

	const columns = useMemo(
		() => [
			columnHelper.accessor('name', {
				header: 'Subempresa',
				cell: (info) => (
					<div className='flex items-center gap-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary-100'>
							<Icon
								icon='HeroBuildingStorefront'
								className='text-lg text-primary-600'
							/>
						</div>
						<div>
							<div className='font-medium'>{info.getValue()}</div>
							<div className='text-xs text-zinc-500'>ID: {info.row.original.id}</div>
						</div>
					</div>
				),
			}),
			columnHelper.accessor('rut', {
				header: 'RUT',
				cell: (info) => {
					const value = info.getValue();
					return value ? (
						<span className='font-mono text-sm'>{value}</span>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin RUT
						</Badge>
					);
				},
			}),
			columnHelper.accessor('phone', {
				header: 'Teléfono',
				cell: (info) => {
					const value = info.getValue();
					return value ? (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroPhone' className='text-xs text-zinc-400' />
							<span className='text-sm'>{value}</span>
						</div>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin teléfono
						</Badge>
					);
				},
			}),
			columnHelper.accessor('email', {
				header: 'Email',
				cell: (info) => {
					const value = info.getValue();
					return value ? (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroEnvelope' className='text-xs text-zinc-400' />
							<span className='text-sm'>{value}</span>
						</div>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin email
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'manager',
				header: 'Gerente',
				cell: (info) => {
					const subempresa = info.row.original;
					const managerName = subempresa.manager?.name || '';
					const managerEmail = subempresa.manager?.email || '';
					const managerPhone =
						subempresa.manager?.phone || subempresa.manager?.phone_number || '';

					if (!managerName) {
						return (
							<Badge variant='outline' className='text-zinc-400'>
								Sin gerente
							</Badge>
						);
					}

					return (
						<div className='flex flex-col'>
							<div className='flex items-center gap-1'>
								<Icon icon='HeroUser' className='text-xs text-zinc-400' />
								<span className='text-sm font-medium text-zinc-800 dark:text-zinc-100'>
									{managerName}
								</span>
							</div>
							{managerEmail && (
								<span className='text-xs text-zinc-500'>{managerEmail}</span>
							)}
							{managerPhone && (
								<span className='text-xs text-zinc-500'>{managerPhone}</span>
							)}
						</div>
					);
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
							icon='HeroPencil'
							onClick={() => onEdit(info.row.original)}
							className='p-1'
						/>
						<Button
							variant='outline'
							size='sm'
							icon='HeroEye'
							onClick={() => navigate(`/gestion/subempresa/${info.row.original.id}`)}
							className='p-1'
						/>
						<Button
							variant='solid'
							size='sm'
							icon='HeroTrash'
							color='red'
							onClick={() => onDelete(info.row.original.id)}
							className='p-1'
						/>
					</div>
				),
			}),
		],
		[navigate, onEdit, onDelete],
	);

	const table = useReactTable({
		data: subempresas,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		initialState: { pagination: { pageSize: 5 } },
	});

	if (loading) {
		return (
			<Card>
				<CardBody>
					<Spinner nombre='Sub Empresas' />
				</CardBody>
			</Card>
		);
	}

	if (subempresas.length === 0) {
		return (
			<Card>
				<CardBody>
					<div className='flex flex-col items-center justify-center py-12 text-center'>
						<div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800'>
							<Icon
								icon='HeroBuildingStorefront'
								className='text-2xl text-zinc-400'
							/>
						</div>
						<h3 className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
							No hay sub empresas creadas
						</h3>
						<p className='mb-4 max-w-sm text-sm text-zinc-500'>
							Comienza agregando tu primera subempresa para organizar mejor tu
							estructura empresarial.
						</p>
						<Button variant='solid' icon='HeroPlus' onClick={onCreate} size='sm'>
							Crear Primera Subempresa
						</Button>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardBody className='overflow-x-auto'>
				<Table>
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
				<div className='mt-4'>
					<TableCardFooterTemplateV2 table={table} />
				</div>
			</CardBody>
		</Card>
	);
}
