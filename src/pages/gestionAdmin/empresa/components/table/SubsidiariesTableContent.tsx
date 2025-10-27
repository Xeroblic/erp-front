import React from 'react';
import { flexRender, Table as TableInstance } from '@tanstack/react-table';
import Table, { TBody, THead, Tr, Th, Td } from '@/components/ui/Table';
import { ISubempresa } from '@/interface/empresas.interface';

interface SubsidiariesTableContentProps {
	table: TableInstance<ISubempresa>;
}

export default function SubsidiariesTableContent({ table }: SubsidiariesTableContentProps) {
	return (
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
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</Td>
							))}
						</Tr>
					))}
				</TBody>
			</Table>
		</div>
	);
}
