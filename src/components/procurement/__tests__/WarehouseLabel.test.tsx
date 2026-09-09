import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mainWarehouse } from '@/mocks/db/procurement.db';
import WarehouseLabel from '../WarehouseLabel';

// `Icon` lee el tema del store; la etiqueta en sí no depende de Redux.
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

describe('WarehouseLabel', () => {
	it('muestra el nombre de la bodega cuando hay ubicación', () => {
		render(<WarehouseLabel warehouse={mainWarehouse} />);

		expect(screen.getByText('Bodega Central')).toBeInTheDocument();
	});

	it('presenta warehouse null como «Sin ubicación», no como dato faltante', () => {
		const { container } = render(<WarehouseLabel warehouse={null} />);

		expect(screen.getByText('Sin ubicación')).toBeInTheDocument();
		// Nada de guiones ni de vacíos: «Sin ubicación» es una ubicación válida de
		// la sucursal, vendible y trasladable.
		expect(container.textContent).not.toMatch(/^[-—–\s]*$/);
		expect(
			container.querySelector('[data-component-name="Procurement/WarehouseLabel"]'),
		).toHaveAttribute('data-unlocated', 'true');
	});
});
