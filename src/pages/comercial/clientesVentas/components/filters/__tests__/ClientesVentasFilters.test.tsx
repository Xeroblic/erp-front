import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ClientesVentasFilters from '../ClientesVentasFilters';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));
vi.mock('@/components/form/Input', () => ({
	default: ({ id, name, value, onChange }: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input id={id} name={name} value={value} onChange={onChange} />
	),
}));

describe('ClientesVentasFilters', () => {
	it('expone una búsqueda controlada y permite limpiarla', () => {
		const onSearchChange = vi.fn();
		const onClear = vi.fn();
		render(
			<ClientesVentasFilters
				search='Andina'
				onSearchChange={onSearchChange}
				onClear={onClear}
			/>,
		);

		const input = screen.getByLabelText('Búsqueda');
		expect(input).toHaveValue('Andina');
		fireEvent.change(input, { target: { value: 'Andina SA' } });
		fireEvent.click(screen.getByRole('button', { name: /limpiar/i }));

		expect(onSearchChange).toHaveBeenCalledWith('Andina SA');
		expect(onClear).toHaveBeenCalledOnce();
	});
});
