import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HardwareAbsenceStatus from '../HardwareAbsenceStatus';

describe('HardwareAbsenceStatus', () => {
	it('describes both absent components in read-only mode', () => {
		render(<HardwareAbsenceStatus hasNoRam hasNoStorage />);

		expect(screen.getByText('RAM: No tiene')).toBeInTheDocument();
		expect(screen.getByText('Almacenamiento: No tiene')).toBeInTheDocument();
	});
});
