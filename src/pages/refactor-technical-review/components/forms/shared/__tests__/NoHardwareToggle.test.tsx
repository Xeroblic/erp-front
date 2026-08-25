import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NoHardwareToggle from '../NoHardwareToggle';

vi.mock('@/components/ui/Button', () => ({
	default: ({ children, isActive: _isActive, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isActive?: boolean }) => (
		<button {...props}>{children}</button>
	),
}));
vi.mock('@/components/icon/Icon', () => ({ default: () => null }));

describe('NoHardwareToggle', () => {
	it('exposes and changes its pressed state through a real button', () => {
		const onToggle = vi.fn();
		render(<NoHardwareToggle isActive={false} label='No tiene RAM' onToggle={onToggle} />);
		const button = screen.getByRole('button', { name: 'No tiene RAM' });
		expect(button).toHaveAttribute('aria-pressed', 'false');
		fireEvent.click(button);
		expect(onToggle).toHaveBeenCalledWith(true);
	});
});
