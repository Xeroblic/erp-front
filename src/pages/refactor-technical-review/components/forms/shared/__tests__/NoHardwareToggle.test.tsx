import type React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NoHardwareToggle from '../NoHardwareToggle';

vi.mock('@/components/form/Checkbox', () => ({
	default: ({
		checked,
		label,
		onChange,
		inputClassName,
	}: {
		checked?: boolean;
		label?: string;
		onChange?: React.ChangeEventHandler<HTMLInputElement>;
		inputClassName?: string;
	}) => (
		<label>
			<input
				type='checkbox'
				checked={checked}
				onChange={onChange}
				className={inputClassName}
			/>
			{label}
		</label>
	),
}));

describe('NoHardwareToggle', () => {
	it('shows the hardware as present and reports an absence when unchecked', () => {
		const onToggle = vi.fn();
		render(<NoHardwareToggle isActive={false} hardwareLabel='RAM' onToggle={onToggle} />);
		const checkbox = screen.getByRole('checkbox', { name: 'Tiene RAM' });
		expect(checkbox).toBeChecked();
		fireEvent.click(checkbox);
		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it('keeps a stable accessible label and highlights the active absence state', () => {
		render(<NoHardwareToggle isActive hardwareLabel='RAM' onToggle={vi.fn()} />);

		const checkbox = screen.getByRole('checkbox', { name: 'Tiene RAM' });
		expect(checkbox).not.toBeChecked();
		expect(checkbox).toHaveClass('!border-red-500', '!bg-red-500');
		expect(screen.queryByText('No tiene RAM')).not.toBeInTheDocument();
	});

	it('restores the presence state when toggled back on', () => {
		const onToggle = vi.fn();
		render(<NoHardwareToggle isActive hardwareLabel='disco' onToggle={onToggle} />);
		const checkbox = screen.getByRole('checkbox', { name: 'Tiene disco' });
		expect(checkbox).not.toBeChecked();
		fireEvent.click(checkbox);
		expect(onToggle).toHaveBeenCalledWith(false);
	});
});
