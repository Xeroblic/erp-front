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
	it('explica los hitos completos para destinatarios internos y cliente', () => {
		render(<ReminderCadenceCard isOpen setIsOpen={vi.fn()} />);

		expect(
			screen.getByRole('heading', { name: 'Recordatorios automáticos' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Equipo de cobranza y encargados' }),
		).toBeInTheDocument();
		expect(screen.getByText('7 días antes')).toBeInTheDocument();
		expect(screen.getByText('2 días antes')).toBeInTheDocument();
		expect(screen.getByText('1 día vencido')).toBeInTheDocument();
		expect(screen.getByText('Cada 5 días')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Cliente deudor' })).toBeInTheDocument();
		expect(
			screen.getByText('No recibe avisos anticipados antes del vencimiento.'),
		).toBeInTheDocument();
		expect(screen.getByText('Día del vencimiento')).toBeInTheDocument();
		expect(screen.getByText('Cada 10 días')).toBeInTheDocument();
	});

	it('solo expone el contenido al abrirse y no incluye campos editables', () => {
		const { rerender } = render(<ReminderCadenceCard isOpen={false} setIsOpen={vi.fn()} />);

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		rerender(<ReminderCadenceCard isOpen setIsOpen={vi.fn()} />);

		expect(
			screen.getByText(/se evalúan diariamente a las 08:30, hora de Santiago/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/se detienen cuando el documento queda pagado/i),
		).toBeInTheDocument();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
	});
});
