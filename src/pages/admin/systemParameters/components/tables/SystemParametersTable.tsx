import React, { useState } from 'react';
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';

import { SystemParameter } from '@/interface';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Table, { TBody, THead, Td, Th, Tr } from '@/components/ui/Table';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';

interface SystemParametersTableProps {
	parameters: SystemParameter[];
	isLoading: boolean;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
	onViewDetails: (parameter: SystemParameter) => void;
	onEdit: (parameter: SystemParameter) => void;
	onDelete: (parameter: SystemParameter) => void;
	loadingActions: Set<number>;
}

const columnHelper = createColumnHelper<SystemParameter>();

const SystemParametersTable: React.FC<SystemParametersTableProps> = ({
	parameters,
	isLoading,
	onViewDetails,
	onEdit,
	onDelete,
	loadingActions,
}) => {
	// Función para obtener el color de la categoria
	const getCategoryColor = (category: string) => {
		const colors = {
			general: 'blue',
			system: 'red',
			email: 'green',
			security: 'yellow',
			integration: 'purple',
			ui: 'pink',
			business: 'indigo',
		} as const;
		return colors[category as keyof typeof colors] || 'gray';
	};

	// Función para obtener el color del tipo de dato
	const getDataTypeColor = (dataType: string) => {
		const colors = {
			string: 'green',
			number: 'blue',
			boolean: 'purple',
			json: 'orange',
			date: 'pink',
		} as const;
		return colors[dataType as keyof typeof colors] || 'gray';
	};

	// Función para formatear el valor según su tipo
	const formatValue = (parameter: SystemParameter) => {
		const { value, data_type } = parameter;

		if (value.length > 50) {
			return `${value.substring(0, 50)}...`;
		}

		switch (data_type) {
			case 'boolean':
				return value === 'true' ? 'Verdadero' : 'Falso';
			case 'json':
				try {
					const parsed = JSON.parse(value);
					return `${JSON.stringify(parsed, null, 2).substring(0, 50)}...`;
				} catch {
					return value;
				}
			default:
				return value;
		}
	};

	const columns = [
		columnHelper.accessor('key', {
			header: 'Clave',
			cell: (info) => {
				const parameter = info.row.original;
				return (
					<div className='flex flex-col space-y-1'>
						<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>
							{info.getValue()}
						</span>
						<span className='line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400'>
							{parameter.description}
						</span>
					</div>
				);
			},
		}),
		columnHelper.accessor('category', {
			header: 'Categoría',
			cell: (info) => <Badge className='capitalize'>{info.getValue()}</Badge>,
		}),
		columnHelper.accessor('data_type', {
			header: 'Tipo',
			cell: (info) => (
				<Badge variant='outline' className='font-mono text-xs capitalize'>
					{info.getValue()}
				</Badge>
			),
		}),
		columnHelper.accessor('value', {
			header: 'Valor',
			cell: (info) => {
				const parameter = info.row.original;
				return (
					<div className='max-w-xs font-mono text-xs'>
						<span className='text-zinc-900 dark:text-zinc-100'>
							{formatValue(parameter)}
						</span>
					</div>
				);
			},
		}),
		columnHelper.accessor('is_editable', {
			header: 'Editable',
			cell: (info) => {
				const isEditable = info.getValue();
				return (
					<div className='flex items-center space-x-2'>
						<Icon
							icon={isEditable ? 'HeroCheck' : 'HeroXMark'}
							className={`h-4 w-4 ${
								isEditable
									? 'text-green-600 dark:text-green-400'
									: 'text-red-600 dark:text-red-400'
							}`}
						/>
						<span className='text-xs text-zinc-500 dark:text-zinc-400'>
							{isEditable ? 'Sí' : 'No'}
						</span>
					</div>
				);
			},
		}),
		columnHelper.accessor('updated_at', {
			header: 'Actualizado',
			cell: (info) => {
				const date = new Date(info.getValue());
				return (
					<div className='text-xs text-zinc-500 dark:text-zinc-400'>
						<div>{date.toLocaleDateString('es-CL')}</div>
						<div>
							{date.toLocaleTimeString('es-CL', {
								hour: '2-digit',
								minute: '2-digit',
							})}
						</div>
					</div>
				);
			},
		}),
		columnHelper.display({
			id: 'actions',
			header: 'Acciones',
			cell: (info) => {
				const parameter = info.row.original;
				const isActionLoading = loadingActions.has(parameter.id);

				return (
					<div className='flex items-center space-x-1'>
						<Button
							size='xs'
							variant='outline'
							icon='HeroEye'
							onClick={() => onViewDetails(parameter)}
							isDisable={isActionLoading}
							className='text-zinc-600 hover:text-blue-600 dark:text-zinc-400'
						/>
						<Button
							size='xs'
							variant='outline'
							icon='HeroPencil'
							onClick={() => onEdit(parameter)}
							isDisable={isActionLoading || !parameter.is_editable}
							className='text-zinc-600 hover:text-amber-600 disabled:opacity-50 dark:text-zinc-400'
						/>
						<Button
							size='xs'
							variant='outline'
							icon='HeroTrash'
							onClick={() => onDelete(parameter)}
							isDisable={isActionLoading || !parameter.is_editable}
							className='text-zinc-600 hover:text-red-600 disabled:opacity-50 dark:text-zinc-400'
						/>
						{isActionLoading && (
							<Icon
								icon='HeroArrowPath'
								className='h-4 w-4 animate-spin text-zinc-400'
							/>
						)}
					</div>
				);
			},
		}),
	];

	const table = useReactTable({
		data: parameters || [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex h-64 items-center justify-center'>
						<div className='flex items-center space-x-3'>
							<Icon
								icon='HeroArrowPath'
								className='h-6 w-6 animate-spin text-zinc-400'
							/>
							<span className='text-zinc-500 dark:text-zinc-400'>
								Cargando parámetros del sistema...
							</span>
						</div>
					</div>
				</CardBody>
			</Card>
		);
	}

	if (!parameters || parameters.length === 0) {
		return (
			<Card>
				<CardBody className='p-6'>
					<div className='flex h-64 flex-col items-center justify-center text-center'>
						<Icon
							icon='HeroCog6Tooth'
							className='mb-4 h-16 w-16 text-zinc-300 dark:text-zinc-600'
						/>
						<h3 className='mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100'>
							No hay parámetros
						</h3>
						<p className='max-w-md text-zinc-500 dark:text-zinc-400'>
							No se encontraron parámetros del sistema que coincidan con los filtros
							aplicados.
						</p>
					</div>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardBody className='p-0'>
				<Table className='table-fixed'>
					<THead>
						{table.getHeaderGroups().map((headerGroup) => (
							<Tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
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
							<Tr
								key={row.id}
								className='transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50'>
								{row.getVisibleCells().map((cell) => (
									<Td key={cell.id} className='py-4'>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</Td>
								))}
							</Tr>
						))}
					</TBody>
				</Table>
			</CardBody>
			<TableCardFooterTemplateV2 table={table} />
		</Card>
	);
};

export default SystemParametersTable;
