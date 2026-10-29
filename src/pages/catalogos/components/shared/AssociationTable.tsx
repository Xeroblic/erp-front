import React from 'react';
import { flexRender, Table as ReactTable } from '@tanstack/react-table';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

interface AssociationTableProps<T> {
	title: string;
	count: number;
	table: ReactTable<T>;
	loading?: boolean;
	emptyMessage: string;
	showOnlyInEditMode?: boolean;
	isEditMode?: boolean;
}

function AssociationTable<T>({
	title,
	count,
	table,
	loading = false,
	emptyMessage,
	showOnlyInEditMode = false,
	isEditMode = false,
}: AssociationTableProps<T>) {
	// Si debe mostrarse solo en modo edición y no estamos en modo edición, no renderizar
	if (showOnlyInEditMode && !isEditMode) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{title} ({count})
				</CardTitle>
			</CardHeader>
			<CardBody>
				{loading ? (
					<div className='flex items-center justify-center py-8'>
						<Icon icon='HeroArrowPath' className='h-6 w-6 animate-spin text-blue-600' />
						<span className='ml-2 text-sm text-gray-600'>Cargando...</span>
					</div>
				) : table.getRowModel().rows.length === 0 ? (
					<div className='py-8 text-center text-sm text-gray-500 dark:text-gray-400'>
						{emptyMessage}
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-left text-sm'>
							<thead className='border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className='px-4 py-3 font-semibold text-gray-700 dark:text-gray-300'>
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
											</th>
										))}
									</tr>
								))}
							</thead>
							<tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
								{table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										className='hover:bg-gray-50 dark:hover:bg-gray-800'>
										{row.getVisibleCells().map((cell) => (
											<td key={cell.id} className='px-4 py-3'>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardBody>
		</Card>
	);
}

export default AssociationTable;
