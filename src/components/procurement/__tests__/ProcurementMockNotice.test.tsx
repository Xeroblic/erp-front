import React from 'react';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// `Alert` lee el tema desde Redux; acá sólo importa qué aviso se muestra.
vi.mock('@/components/ui/Alert', () => ({
	default: ({ title, children }: { title: ReactNode; children: ReactNode }) => (
		<div role='alert'>
			<strong>{title}</strong>
			{children}
		</div>
	),
}));

const flag = { enabled: false };
vi.mock('@/config/inventoryStock.config', () => ({
	get default() {
		return flag.enabled;
	},
}));

const { ProcurementMockNotice } = await import('@/components/procurement/ProcurementMockNotice');

afterEach(() => {
	flag.enabled = false;
});

describe('ProcurementMockNotice', () => {
	it('por omisión sigue la bandera de Inventario', () => {
		const { rerender } = render(<ProcurementMockNotice />);
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();

		flag.enabled = true;
		rerender(<ProcurementMockNotice key='encendida' />);
		expect(screen.getByText('Datos simulados')).toBeInTheDocument();
	});

	it('una pantalla con bandera propia decide por la suya', () => {
		flag.enabled = true;
		const { rerender } = render(<ProcurementMockNotice isActive={false} />);
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();

		flag.enabled = false;
		rerender(<ProcurementMockNotice isActive />);
		expect(screen.getByText('Datos simulados')).toBeInTheDocument();
	});
});
