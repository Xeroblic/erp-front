import { StrictMode, type InputHTMLAttributes, type ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrazabilidadFilters } from '../TrazabilidadFilters';

vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/form/Input', () => ({
	default: (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		disabled,
	}: {
		children: ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	}) => (
		<button type='button' onClick={onClick} disabled={disabled}>
			{children}
		</button>
	),
}));

describe('TrazabilidadFilters', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('aplica la búsqueda con debounce y al limpiar consulta una sola vez', () => {
		const onApplyFilters = vi.fn();
		const onClearFilters = vi.fn();
		render(
			<TrazabilidadFilters
				filters={{}}
				onApplyFilters={onApplyFilters}
				onClearFilters={onClearFilters}
			/>,
		);

		fireEvent.change(screen.getByLabelText('Buscar producto'), {
			target: { value: 'SKU-7' },
		});
		act(() => {
			vi.advanceTimersByTime(600);
		});
		expect(onApplyFilters).toHaveBeenCalledTimes(1);
		expect(onApplyFilters).toHaveBeenLastCalledWith({ q: 'SKU-7' });

		fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/ }));
		act(() => {
			vi.advanceTimersByTime(600);
		});

		expect(onClearFilters).toHaveBeenCalledTimes(1);
		expect(onApplyFilters).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('Buscando...')).not.toBeInTheDocument();
	});

	it('al limpiar descarta una búsqueda pendiente de debounce', () => {
		const onApplyFilters = vi.fn();
		const onClearFilters = vi.fn();
		render(
			<TrazabilidadFilters
				filters={{}}
				onApplyFilters={onApplyFilters}
				onClearFilters={onClearFilters}
			/>,
		);

		fireEvent.change(screen.getByLabelText('Buscar producto'), {
			target: { value: 'SKU-7' },
		});
		fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/ }));
		act(() => {
			vi.advanceTimersByTime(600);
		});

		expect(onClearFilters).toHaveBeenCalledTimes(1);
		expect(onApplyFilters).not.toHaveBeenCalled();
	});

	it('no aplica filtros al montar, ni siquiera con el doble montaje de StrictMode', () => {
		const onApplyFilters = vi.fn();
		render(
			<StrictMode>
				<TrazabilidadFilters
					filters={{}}
					onApplyFilters={onApplyFilters}
					onClearFilters={vi.fn()}
				/>
			</StrictMode>,
		);

		act(() => {
			vi.advanceTimersByTime(600);
		});

		expect(onApplyFilters).not.toHaveBeenCalled();
		expect(screen.queryByText('Buscando...')).not.toBeInTheDocument();
	});
});
