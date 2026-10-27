import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { createColumnHelper } from '@tanstack/react-table';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import DataTable from '../DataTable';
import { AppTableFeatures } from '../tableFeatures';

vi.mock('@/components/icon/Icon', () => ({
	default: () => <span aria-hidden='true' />,
}));

interface IRow {
	name: string;
	note: string | null;
	active: boolean;
}

const columnHelper = createColumnHelper<AppTableFeatures, IRow>();

const columns = columnHelper.columns([
	columnHelper.accessor('name', { header: 'Nombre' }),
	columnHelper.accessor('note', { header: 'Nota', cell: (info) => info.getValue() ?? '' }),
	columnHelper.accessor('active', {
		header: 'Activo',
		cell: (info) => (info.getValue() ? 'sí' : 'no'),
	}),
]);

const rows: IRow[] = [
	{ name: 'Alfa', note: null, active: true },
	{ name: 'Beta', note: 'urgente', active: false },
];

const search = (value: string) => {
	fireEvent.change(screen.getByPlaceholderText('Buscar...'), { target: { value } });
};

describe('DataTable — búsqueda global', () => {
	it('busca en una columna aunque la primera fila venga vacía', () => {
		renderWithStore(<DataTable<IRow> columns={columns} data={rows} />, buildAuthState());

		search('urgente');

		expect(screen.getByText('Beta')).toBeInTheDocument();
		expect(screen.queryByText('Alfa')).not.toBeInTheDocument();
	});

	it('no busca en columnas booleanas', () => {
		renderWithStore(<DataTable<IRow> columns={columns} data={rows} />, buildAuthState());

		search('true');

		expect(screen.queryByText('Alfa')).not.toBeInTheDocument();
		expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
	});
});
