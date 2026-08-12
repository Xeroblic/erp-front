import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Table, { THead, Tr } from '@/components/ui/Table';
import SortableTableHeader, { type TableSortState } from '../SortableTableHeader';

type SortKey = 'name' | 'status';

const renderHeader = (sort: TableSortState<SortKey>, onSort = vi.fn()) => {
	render(
		<Table>
			<THead>
				<Tr>
					<SortableTableHeader
						label='Nombre'
						sortKey='name'
						sort={sort}
						onSort={onSort}
					/>
				</Tr>
			</THead>
		</Table>,
	);
	return onSort;
};

describe('SortableTableHeader', () => {
	it('expone el estado de orden y activa la clave con un botón accesible', () => {
		const onSort = renderHeader({ key: 'name', direction: 'asc' });
		const button = screen.getByRole('button', { name: 'Ordenar por Nombre' });

		expect(button.closest('th')).toHaveAttribute('aria-sort', 'ascending');
		fireEvent.click(button);
		expect(onSort).toHaveBeenCalledWith('name');
	});

	it('marca como no ordenada una columna distinta de la clave activa', () => {
		renderHeader({ key: 'status', direction: 'desc' });

		expect(
			screen.getByRole('button', { name: 'Ordenar por Nombre' }).closest('th'),
		).toHaveAttribute('aria-sort', 'none');
	});
});
