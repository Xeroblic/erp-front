import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Cada fuente de Inventario tiene su bandera: el aviso de datos simulados no
 * puede depender sólo de la del resumen.
 */
const renderNotice = async (
	{ overview, operations }: { overview: boolean; operations: boolean },
	withTraceability = true,
) => {
	vi.resetModules();
	vi.doMock('@/config/inventoryOverview.config', () => ({ default: overview }));
	vi.doMock('@/config/inventoryOperations.config', () => ({ default: operations }));
	const { default: InventoryMockNotice } = await import(
		'@/pages/inventario/Inventario/components/parts/InventoryMockNotice'
	);
	// Tras resetModules, el Provider tiene que ser del mismo registro que el componente.
	const { buildAuthState, withStore } = await import('@/test-utils/renderWithStore');
	const { Wrapper } = withStore(buildAuthState({ permisos: [] }));
	const view = render(
		<Wrapper>
			<InventoryMockNotice withTraceability={withTraceability} />
		</Wrapper>,
	);
	return view;
};

afterEach(() => {
	vi.doUnmock('@/config/inventoryOverview.config');
	vi.doUnmock('@/config/inventoryOperations.config');
});

describe('InventoryMockNotice', () => {
	it('con Inventario real y la trazabilidad simulada advierte el historial ficticio', async () => {
		await renderNotice({ overview: false, operations: true });

		expect(screen.getByText('Datos simulados')).toBeInTheDocument();
		expect(screen.getByText(/La trazabilidad es de demostración/)).toBeInTheDocument();
	});

	it('sin trazabilidad en la pantalla no avisa de ella', async () => {
		await renderNotice({ overview: false, operations: true }, false);

		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
	});

	it('con Inventario simulado avisa por las cantidades', async () => {
		await renderNotice({ overview: true, operations: false });

		expect(
			screen.getByText(/Las cantidades no representan el inventario real/),
		).toBeInTheDocument();
	});

	it('con ambas fuentes reales no muestra aviso', async () => {
		await renderNotice({ overview: false, operations: false });

		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
	});
});
