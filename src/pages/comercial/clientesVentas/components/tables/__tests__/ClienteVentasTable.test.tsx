import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClienteVentasTable from '../ClienteVentasTable';

vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/form/Input', () => ({
	default: ({ name, value, onChange }: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input name={name} value={value} onChange={onChange} />
	),
}));
vi.mock('@/components/form/Select', () => ({
	default: ({
		children,
		name,
		value,
		onChange,
	}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
		<select name={name} value={value} onChange={onChange}>
			{children}
		</select>
	),
}));

const meta = {
	current_page: 1,
	from: 1,
	last_page: 2,
	per_page: 10,
	to: 10,
	total: 12,
};

const customer = {
	id: 8,
	name: 'Comercial Andina Ltda.',
	rut: '76.123.456-7',
	contact: { name: 'Ana Pérez', email: 'ana@example.com', phone: '+56912345678' },
	loyalty: 70,
	total_sales: 150000,
	is_active: true,
};

const renderTable = (overrides: Partial<React.ComponentProps<typeof ClienteVentasTable>> = {}) =>
	render(
		<ClienteVentasTable
			rows={[customer]}
			meta={meta}
			loading={false}
			hasError={false}
			hasSearch={false}
			onPaginationChange={vi.fn()}
			onDelete={vi.fn()}
			onView={vi.fn()}
			{...overrides}
		/>,
	);

describe('ClienteVentasTable', () => {
	it('muestra el total remoto, no solo la cantidad de la página', () => {
		renderTable();
		expect(screen.getByText('12 clientes')).toBeInTheDocument();
		expect(screen.getByText('Comercial Andina Ltda.')).toBeInTheDocument();
	});

	it.each([null, '', '   '])('muestra un fallback si el correo es %p', (email) => {
		renderTable({ rows: [{ ...customer, contact: { ...customer.contact, email } }] });

		expect(screen.getByText('Sin correo registrado')).toBeInTheDocument();
	});

	it('distingue una búsqueda sin resultados de una lista vacía', () => {
		renderTable({
			rows: [],
			hasSearch: true,
			meta: { ...meta, from: null, to: null, total: 0 },
		});
		expect(screen.getByText('Sin resultados para la búsqueda aplicada')).toBeInTheDocument();
		expect(screen.queryByText('Aún no hay clientes registrados')).not.toBeInTheDocument();
	});

	it('no afirma que no existen clientes si la página recibida quedó fuera de rango', () => {
		renderTable({
			rows: [],
			meta: { ...meta, current_page: 2, last_page: 1, from: null, to: null, total: 10 },
		});

		expect(screen.getByText('10 clientes')).toBeInTheDocument();
		expect(screen.queryByText('Aún no hay clientes registrados')).not.toBeInTheDocument();
	});

	it('ordena sólo las filas visibles al seleccionar una cabecera ordenable', () => {
		const secondCustomer = { ...customer, id: 9, name: 'Abarrotes Norte', total_sales: 200000 };
		renderTable({ rows: [customer, secondCustomer] });

		fireEvent.click(screen.getByRole('button', { name: 'Ordenar por Nombre' }));

		const names = screen.getAllByRole('cell', { name: /Comercial Andina|Abarrotes Norte/ });
		expect(names.map((cell) => cell.textContent)).toEqual([
			'Abarrotes Norte',
			'Comercial Andina Ltda.',
		]);
		expect(screen.getByRole('columnheader', { name: 'Nombre' })).toHaveAttribute(
			'aria-sort',
			'ascending',
		);
	});

	it('no muestra el contador ni las filas cuando la consulta falla', () => {
		renderTable({ hasError: true });
		expect(screen.getByText('No fue posible mostrar los clientes')).toBeInTheDocument();
		expect(screen.queryByText('12 clientes')).not.toBeInTheDocument();
		expect(screen.queryByText('Comercial Andina Ltda.')).not.toBeInTheDocument();
	});
});
