import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HardwareAbsenceStatus from '../HardwareAbsenceStatus';

vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span data-testid='mock-icon'>{icon}</span>,
}));

describe('HardwareAbsenceStatus', () => {
	it('renders the absence message for RAM inside a muted container', () => {
		render(<HardwareAbsenceStatus hardwareLabel='RAM' />);

		expect(screen.getByText('No tiene RAM')).toBeInTheDocument();
		expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
	});

	it('renders the absence message for storage', () => {
		render(<HardwareAbsenceStatus hardwareLabel='disco' />);

		expect(screen.getByText('No tiene disco')).toBeInTheDocument();
	});

	it('renders exactly the message for the received hardware label', () => {
		render(<HardwareAbsenceStatus hardwareLabel='Unidad óptica' />);

		expect(screen.getByText('No tiene Unidad óptica')).toBeInTheDocument();
	});
});
