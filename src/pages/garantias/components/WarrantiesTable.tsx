import React, { useMemo } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import WarrantyStatusBadge from './WarrantyStatusBadge';
import type { Warranty } from '@/interface/warranties.interface';
import { formatProductDisplay } from '../utils/warranty.utils';

type DecoratedWarranty = Warranty & {
	warrantyTypeLabel?: string;
	periodLabel?: string;
	daysRemaining?: { label: string; isExpired: boolean };
};

const columnHelper = createColumnHelper<DecoratedWarranty>();

interface WarrantiesTableProps {
	warranties: DecoratedWarranty[];
	loading: boolean;
	meta: { total?: number; last_page?: number };
	page: number;
	perPage: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onView: (warranty: DecoratedWarranty) => void;
	onEdit: (warranty: DecoratedWarranty) => void;
	onDelete: (warranty: DecoratedWarranty) => void;
}

const WarrantiesTable: React.FC<WarrantiesTableProps> = ({
	warranties,
	loading,
	meta,
	page,
	perPage,
	onPageChange,
	onPageSizeChange,
	onView,
	onEdit,
	onDelete,
}) => {
	const data = warranties ?? [];

	const columns = useMemo(
		() => [
			columnHelper.accessor('status', {
				header: 'Estado',
				cell: (info) => <WarrantyStatusBadge status={info.getValue()} />,
			}),
			columnHelper.accessor((row) => row.product, {
				id: 'product',
				header: 'Producto',
				cell: (info) => {
					const product = info.getValue();
					return (
						<div className='flex flex-col'>
							<span className='font-semibold text-zinc-900 dark:text-zinc-100'>
								{formatProductDisplay(product)}
							</span>
							{info.row.original.serial_number && (
								<span className='text-xs text-zinc-500'>
									Serie: {info.row.original.serial_number}
								</span>
							)}
						</div>
					);
				},
			}),
			columnHelper.accessor((row) => row.warrantyTypeLabel, {
				id: 'type',
				header: 'Tipo de garantía',
				cell: (info) => (
					<span className='text-sm text-zinc-700 dark:text-zinc-200'>
						{info.getValue() ?? '—'}
					</span>
				),
			}),
			columnHelper.accessor((row) => row.periodLabel, {
				id: 'period',
				header: 'Período',
				cell: (info) => (
					<div className='flex flex-col text-sm text-zinc-700 dark:text-zinc-200'>
						{info.getValue() ?? '—'}
					</div>
				),
			}),
			columnHelper.accessor((row) => row.daysRemaining, {
				id: 'daysRemaining',
				header: 'Días restantes',
				cell: (info) => {
					const value = info.getValue();
					if (!value) return <span className='text-sm text-zinc-400'>—</span>;
					return (
						<span
							className={`text-sm font-medium ${
								value.isExpired ? 'text-red-600' : 'text-emerald-600'
							}`}>
							{value.label}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: 'actions',
				header: 'Acciones',
				cell: (info) => {
					const warranty = info.row.original;
					return (
						<div className='flex items-center space-x-2'>
							<Button
								size='sm'
								variant='outline'
								icon='HeroEye'
								onClick={() => onView(warranty)}
								aria-label='Ver garantía'
							/>
							<Button
								size='sm'
								variant='outline'
								icon='HeroPencil'
								onClick={() => onEdit(warranty)}
								aria-label='Editar garantía'
							/>
							<Button
								size='sm'
								variant='outline'
								color='red'
								icon='HeroTrash'
								onClick={() => onDelete(warranty)}
								aria-label='Eliminar garantía'
							/>
						</div>
					);
				},
			}),
		],
		[onDelete, onEdit, onView],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		onPaginationChange: (updater) => {
			const next =
				typeof updater === 'function'
					? updater({ pageIndex: page - 1, pageSize: perPage })
					: updater;
			if (next.pageIndex !== undefined && next.pageIndex !== page - 1) {
				onPageChange(next.pageIndex + 1);
			}
			if (next.pageSize !== undefined && next.pageSize !== perPage) {
				onPageSizeChange(next.pageSize);
			}
		},
		pageCount: meta?.last_page ?? 1,
		state: {
			pagination: {
				pageIndex: page - 1,
				pageSize: perPage,
			},
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg font-semibold text-zinc-900 dark:text-white'>
					Garantías registradas
				</CardTitle>
				<div className='flex items-center space-x-2 text-sm text-zinc-500'>
					<Icon icon='HeroShieldCheck' className='h-5 w-5 text-emerald-600' />
					<span>{meta?.total ?? 0} garantías</span>
				</div>
			</CardHeader>
			<CardBody className='overflow-x-auto'>
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
						{loading && (
							<Tr>
								<Td colSpan={columns.length}>
									<div className='flex items-center justify-center space-x-2 py-6 text-sm text-zinc-500'>
										<Icon icon='DuoLoading' className='h-5 w-5 animate-spin' />
										<span>Cargando garantías...</span>
									</div>
								</Td>
							</Tr>
						)}
						{!loading && data.length === 0 && (
							<Tr>
								<Td colSpan={columns.length}>
									<div className='flex flex-col items-center justify-center space-y-2 py-6 text-center text-sm text-zinc-500'>
										<Icon icon='HeroInbox' className='h-8 w-8 text-zinc-400' />
										<span>
											No se encontraron garantías con los filtros actuales.
										</span>
									</div>
								</Td>
							</Tr>
						)}
						{!loading &&
							table.getRowModel().rows.map((row) => (
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
			</CardBody>
			{data.length > 0 && <TableCardFooterTemplateV2 table={table as any} />}
		</Card>
	);
};

export default WarrantiesTable;
