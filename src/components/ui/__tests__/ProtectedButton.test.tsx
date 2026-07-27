import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProtectedButton from '../ProtectedButton';

vi.mock('@/components/authorization/PermissionGuard', () => ({
	default: ({ fallback }: { fallback?: React.ReactNode }) => <div>{fallback}</div>,
}));

vi.mock('../Button', () => ({
	default: ({
		children,
		isDisable,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isDisable?: boolean }) => (
		<button type='button' disabled={isDisable} {...props}>
			{children}
		</button>
	),
}));

describe('ProtectedButton', () => {
	it('muestra un fallback deshabilitado cuando falta el permiso', () => {
		render(
			<ProtectedButton
				permission='permiso-futuro'
				fallbackMode='disabled'
				disabledTooltip='Disponible próximamente'>
				Nuevo documento
			</ProtectedButton>,
		);

		const button = screen.getByRole('button', { name: 'Nuevo documento' });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('title', 'Disponible próximamente');
	});
});
