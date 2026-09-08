import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { allowedActionsByState } from '@/mocks/db/procurement.db';
import AllowedActionsToolbar, { PROCUREMENT_ACTION_DEFINITIONS } from '../AllowedActionsToolbar';

const authorizationCalls = vi.hoisted(
	() =>
		[] as {
			permission?: string | string[];
			branchId?: number | null;
			scope?: string;
		}[],
);

const authorizationState = vi.hoisted(() => ({ hasAccess: true }));

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({
		authorize: (input: {
			permission?: string | string[];
			branchId?: number | null;
			scope?: string;
		}) => {
			authorizationCalls.push(input);

			return authorizationState.hasAccess;
		},
		hasAnyPermission: () => authorizationState.hasAccess,
		isLoading: false,
		isSuperAdmin: false,
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

describe('AllowedActionsToolbar', () => {
	beforeEach(() => {
		authorizationCalls.length = 0;
		authorizationState.hasAccess = true;
	});

	it('deriva los botones de allowed_actions', () => {
		render(
			<AllowedActionsToolbar
				allowedActions={allowedActionsByState.documentDraft}
				resource='purchase_document'
				onAction={vi.fn()}
			/>,
		);

		expect(screen.getByRole('button', { name: /Editar/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Confirmar/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Anular/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Adjuntar/ })).toBeInTheDocument();
		// Lo que el backend no ofrece no aparece, aunque el registro lo conozca.
		expect(screen.queryByRole('button', { name: /Crear recepción/ })).not.toBeInTheDocument();
	});

	it('no sustituye la autorización: cada botón pasa por su guard con contexto', () => {
		render(
			<AllowedActionsToolbar
				allowedActions={['confirm']}
				resource='purchase_document'
				branchId={4}
				subsidiaryId={2}
				scope='access'
				onAction={vi.fn()}
			/>,
		);

		expect(authorizationCalls).toHaveLength(1);
		expect(authorizationCalls[0]).toMatchObject({
			permission: 'confirm-purchase-document',
			branchId: 4,
			scope: 'access',
		});
	});

	it('resuelve el permiso según el recurso, no según el nombre de la acción', () => {
		// `update` sobre una recepción exige edit-product; sobre un documento,
		// edit-purchase-document. Un registro global le daría a la recepción el
		// permiso equivocado y dejaría el botón visible para quien no puede usarlo.
		expect(PROCUREMENT_ACTION_DEFINITIONS.stock_receipt.update?.permission).toBe(
			'edit-product',
		);
		expect(PROCUREMENT_ACTION_DEFINITIONS.purchase_document.update?.permission).toBe(
			'edit-purchase-document',
		);
		expect(PROCUREMENT_ACTION_DEFINITIONS.supplier.update?.permission).toBe(
			'edit-procurement-supplier',
		);

		render(
			<AllowedActionsToolbar
				allowedActions={['update']}
				resource='stock_receipt'
				branchId={4}
				onAction={vi.fn()}
			/>,
		);

		expect(authorizationCalls[0]).toMatchObject({ permission: 'edit-product' });
	});

	it('omite una acción que no corresponde al recurso en vez de adivinar permiso', () => {
		render(
			<AllowedActionsToolbar
				allowedActions={['post', 'confirm']}
				resource='stock_receipt'
				onAction={vi.fn()}
			/>,
		);

		expect(screen.getByRole('button', { name: /Contabilizar/ })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Confirmar/ })).not.toBeInTheDocument();
	});

	it('dice que no hay acciones cuando allowed_actions es []', () => {
		render(
			<AllowedActionsToolbar
				allowedActions={allowedActionsByState.documentCancelled}
				resource='purchase_document'
				onAction={vi.fn()}
			/>,
		);

		expect(screen.getByText('Sin acciones disponibles')).toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});
