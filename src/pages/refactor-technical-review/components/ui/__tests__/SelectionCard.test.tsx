import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SelectionCard } from '../SelectionCard';

describe('SelectionCard', () => {
	it('uses native disabled semantics and does not invoke the selection handler', () => {
		const onClick = vi.fn();

		render(
			<SelectionCard
				label='DDR5'
				value='DDR5'
				isSelected={false}
				onClick={onClick}
				disabled
			/>,
		);

		const option = screen.getByRole('button', { name: 'DDR5' });
		expect(option).toBeDisabled();
		fireEvent.click(option);
		expect(onClick).not.toHaveBeenCalled();
	});
});
