import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReminderCadenceCard from '../components/ReminderCadenceCard';

vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span aria-hidden='true' data-icon={icon} />,
}));

vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div role='dialog'>{children}</div> : null,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ReminderCadenceCard', () => {
	it('actualiza la información y el ejemplo sin alterar la composición de las tarjetas', () => {
		render(<ReminderCadenceCard isOpen setIsOpen={vi.fn()} />);

		expect(
			screen.getByRole('heading', { name: 'Recordatorios automáticos' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Equipo de cobranza y encargados' }),
		).toBeInTheDocument();
		expect(screen.getByText('7 días antes')).toBeInTheDocument();
		expect(screen.getByText('1 día antes')).toBeInTheDocument();
		expect(screen.getByText('Cada 5 días')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Cliente deudor' })).toBeInTheDocument();
		expect(screen.getByText('Día del vencimiento')).toBeInTheDocument();
		expect(screen.getByText('Cada 10 días')).toBeInTheDocument();
		expect(
			screen.getByText(/7 días antes, el equipo recibe un aviso/i),
		).toBeInTheDocument();
		expect(screen.getByText(/a los 4, 9, 14 y 19 días/i)).toBeInTheDocument();
		expect(screen.queryByText('lead_days')).not.toBeInTheDocument();
		expect(screen.queryByText('overdue_every')).not.toBeInTheDocument();
		expect(screen.queryByText('D-2')).not.toBeInTheDocument();
		expect(screen.getByText('Primer aviso al cliente.')).toBeInTheDocument();
	});

	it('solo expone el contenido al abrirse y no incluye campos editables', () => {
		const { rerender } = render(<ReminderCadenceCard isOpen={false} setIsOpen={vi.fn()} />);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		rerender(<ReminderCadenceCard isOpen setIsOpen={vi.fn()} />);

		expect(
			screen.getByText(/se evalúan diariamente a las 08:30, hora de Santiago/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/se detiene cuando el documento queda pagado/i),
		).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});
});
