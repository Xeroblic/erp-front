import type React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HardwareCard from '../HardwareCard';

vi.mock('@/components/form/Checkbox', () => ({
	default: ({
		checked,
		label,
		onChange,
	}: {
		checked?: boolean;
		label?: string;
		onChange?: React.ChangeEventHandler<HTMLInputElement>;
	}) => (
		<label>
			<input type='checkbox' checked={checked} onChange={onChange} />
			{label}
		</label>
	),
}));

vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span data-testid='mock-icon'>{icon}</span>,
}));

interface RenderOptions {
	title?: string;
	accent?: 'blue' | 'purple';
	isAbsent?: boolean;
	onToggleAbsence?: (absent: boolean) => void;
	hardwareLabel?: string;
	readOnly?: boolean;
}

const renderHardwareCard = (options: RenderOptions = {}) => {
	const props = {
		title: options.title ?? 'Memoria RAM',
		accent: options.accent ?? ('blue' as const),
		isAbsent: options.isAbsent ?? false,
		onToggleAbsence: options.onToggleAbsence ?? vi.fn(),
		hardwareLabel: options.hardwareLabel ?? 'RAM',
		readOnly: options.readOnly ?? false,
		children: <div data-testid='hardware-fields'>Campos de hardware</div>,
	};
	return render(
		<HardwareCard
			title={props.title}
			accent={props.accent}
			isAbsent={props.isAbsent}
			onToggleAbsence={props.onToggleAbsence}
			hardwareLabel={props.hardwareLabel}
			readOnly={props.readOnly}>
			{props.children}
		</HardwareCard>,
	);
};

describe('HardwareCard', () => {
	it('renders the header with title and inline switch when the hardware is present', () => {
		renderHardwareCard();

		expect(screen.getByText('Memoria RAM')).toBeInTheDocument();
		const checkbox = screen.getByRole('checkbox', { name: 'Tiene RAM' });
		expect(checkbox).toBeChecked();
		expect(screen.getByTestId('hardware-fields')).toBeInTheDocument();
		expect(screen.queryByText('No tiene RAM')).not.toBeInTheDocument();
	});

	it('collapses into a dimmed state showing the absence message while keeping the switch operable', () => {
		const onToggleAbsence = vi.fn();
		renderHardwareCard({ isAbsent: true, onToggleAbsence });

		expect(screen.getByText('No tiene RAM')).toBeInTheDocument();
		expect(screen.queryByTestId('hardware-fields')).not.toBeInTheDocument();

		const container = screen.getByText('Memoria RAM').closest('div.rounded-xl');
		expect(container?.className).toContain('opacity-60');

		fireEvent.click(screen.getByRole('checkbox', { name: 'Tiene RAM' }));
		expect(onToggleAbsence).toHaveBeenCalledWith(false);
	});

	it('hides the switch in read-only mode but keeps the card layout', () => {
		renderHardwareCard({ readOnly: true });

		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		expect(screen.getByText('Memoria RAM')).toBeInTheDocument();
		expect(screen.getByTestId('hardware-fields')).toBeInTheDocument();
	});

	it('shows the absence message in read-only mode without any switch', () => {
		renderHardwareCard({ readOnly: true, isAbsent: true });

		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		expect(screen.getByText('No tiene RAM')).toBeInTheDocument();
		expect(screen.queryByTestId('hardware-fields')).not.toBeInTheDocument();
	});

	it('marks the title as required and applies the purple accent tokens', () => {
		renderHardwareCard({
			title: 'Almacenamiento',
			accent: 'purple',
			hardwareLabel: 'disco',
		});

		const title = screen.getByText('Almacenamiento');
		expect(title).toHaveClass('text-purple-800');
		expect(screen.getByRole('checkbox', { name: 'Tiene disco' })).toBeInTheDocument();
	});
});
