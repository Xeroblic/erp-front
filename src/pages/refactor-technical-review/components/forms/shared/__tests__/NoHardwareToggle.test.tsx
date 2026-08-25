import type React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NoHardwareToggle from '../NoHardwareToggle';

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

describe('NoHardwareToggle', () => {
	it('exposes and changes its pressed state through a real button', () => {
		const onToggle = vi.fn();
		render(<NoHardwareToggle isActive={false} hardwareLabel='RAM' onToggle={onToggle} />);
		const checkbox = screen.getByRole('checkbox', { name: 'Tiene RAM' });
		expect(checkbox).toBeChecked();
		fireEvent.click(checkbox);
		expect(onToggle).toHaveBeenCalledWith(true);
	});
});
