import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedButton from '../ProtectedButton';

const authorizationState = vi.hoisted(() => ({
	hasAccess: false,
	isLoading: false,
	isSuperAdmin: false,
}));

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: () => authorizationState.hasAccess,
		hasAnyPermission: () => authorizationState.hasAccess,
		isLoading: authorizationState.isLoading,
		isSuperAdmin: authorizationState.isSuperAdmin,
	}),
}));

vi.mock('@/hooks/useColorIntensity', () => ({
	default: () => ({ textColor: 'text-white', shadeColorIntensity: '600' }),
}));

vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

describe('ProtectedButton', () => {
	beforeEach(() => {
		authorizationState.hasAccess = false;
		authorizationState.isLoading = false;
		authorizationState.isSuperAdmin = false;

		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	afterEach(() => {
		document.getElementById('portal-root')?.remove();
	});

	it('oculta el botón sin autorización por defecto y con fallbackMode hidden', () => {
		const { rerender } = render(
			<ProtectedButton permission='edit-customer'>Editar</ProtectedButton>,
		);

		expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();

		rerender(
			<ProtectedButton permission='edit-customer' fallbackMode='hidden'>
				Editar
			</ProtectedButton>,
		);

		expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
	});

	it('muestra el fallback deshabilitado con explicación genérica sin ejecutar onClick', async () => {
		const onClick = vi.fn();
		render(
			<ProtectedButton
				permission='edit-customer'
				fallbackMode='disabled'
				className='accion-protegida'
				onClick={onClick}>
				Editar cliente
			</ProtectedButton>,
		);

		const button = screen.getByRole('button', { name: 'Editar cliente' });
		const trigger = button.parentElement as HTMLElement;
		expect(button).toBeDisabled();
		expect(button).toHaveClass('accion-protegida');
		expect(trigger).toHaveAttribute('tabindex', '0');
		expect(trigger).toHaveClass('!cursor-not-allowed');

		await act(async () => {
			fireEvent.focus(trigger);
			await Promise.resolve();
		});
		expect(screen.getByRole('tooltip')).toHaveTextContent(
			'No tienes permiso para realizar esta acción',
		);

		fireEvent.click(button);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('expone disabledTooltip por mouse y teclado sin habilitar la acción', async () => {
		const onClick = vi.fn();
		render(
			<ProtectedButton
				permission='edit-customer'
				fallbackMode='disabled'
				disabledTooltip='No tienes permiso para editar'
				onClick={onClick}>
				Editar
			</ProtectedButton>,
		);

		const button = screen.getByRole('button', { name: 'Editar' });
		const trigger = button.parentElement as HTMLElement;
		expect(button).toBeDisabled();
		expect(trigger).toHaveAttribute('tabindex', '0');

		await act(async () => {
			fireEvent.mouseEnter(trigger);
			await Promise.resolve();
		});
		let tooltip = screen.getByRole('tooltip');
		expect(tooltip).toHaveTextContent('No tienes permiso para editar');
		expect(trigger).toHaveAttribute('aria-describedby', tooltip.id);

		await act(async () => {
			fireEvent.mouseLeave(trigger);
			await Promise.resolve();
		});
		expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

		await act(async () => {
			fireEvent.focus(trigger);
			await Promise.resolve();
		});
		tooltip = screen.getByRole('tooltip');
		expect(tooltip).toHaveTextContent('No tienes permiso para editar');

		fireEvent.keyDown(trigger, { key: 'Enter' });
		fireEvent.click(button);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('prioriza disabledTooltip y expone el title original por mouse cuando no se define', async () => {
		const { rerender } = render(
			<ProtectedButton
				permission='edit-customer'
				fallbackMode='disabled'
				title='Título original'
				disabledTooltip='No tienes permiso para editar'>
				Editar
			</ProtectedButton>,
		);

		expect(screen.getByRole('button', { name: 'Editar' })).toHaveAttribute(
			'title',
			'No tienes permiso para editar',
		);

		rerender(
			<ProtectedButton
				permission='edit-customer'
				fallbackMode='disabled'
				title='Título original'>
				Editar
			</ProtectedButton>,
		);

		expect(screen.getByRole('button', { name: 'Editar' })).toHaveAttribute(
			'title',
			'Título original',
		);

		const trigger = screen.getByRole('button', { name: 'Editar' }).parentElement as HTMLElement;
		await act(async () => {
			fireEvent.mouseEnter(trigger);
			await Promise.resolve();
		});
		expect(screen.getByRole('tooltip')).toHaveTextContent('Título original');
	});

	it('renderiza el botón operativo cuando la autorización permite la acción', () => {
		authorizationState.hasAccess = true;

		render(
			<ProtectedButton
				permission='edit-customer'
				fallbackMode='disabled'
				disabledTooltip='No tienes permiso para editar'>
				Editar
			</ProtectedButton>,
		);

		const button = screen.getByRole('button', { name: 'Editar' });
		expect(button).toBeEnabled();
		expect(button).not.toHaveAttribute('title');
	});
});
