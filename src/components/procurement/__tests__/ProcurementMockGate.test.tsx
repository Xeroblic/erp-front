import React from 'react';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: { children: ReactNode }) => <header>{children}</header>,
	SubheaderLeft: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/layouts/Subheader/SubheaderTitle', () => ({
	default: ({ title }: { title: ReactNode }) => <h1>{title}</h1>,
}));
vi.mock('@/components/layouts/Container/Container', () => ({
	default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
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

const { default: ProcurementMockGate, ProcurementMockNotice } = await import(
	'@/components/procurement/ProcurementMockGate'
);

const Pantalla = () => (
	<>
		<ProcurementMockNotice />
		<p>Listado de proveedores</p>
	</>
);

afterEach(() => {
	flag.enabled = false;
});

describe('ProcurementMockGate', () => {
	it('con la bandera apagada no monta la pantalla y avisa que no está habilitada', () => {
		render(
			<ProcurementMockGate title='Proveedores' icon='HeroBuildingStorefront'>
				<Pantalla />
			</ProcurementMockGate>,
		);

		expect(screen.queryByText('Listado de proveedores')).not.toBeInTheDocument();
		expect(screen.getByText('Pantalla no habilitada')).toBeInTheDocument();
		expect(screen.queryByText('Datos simulados')).not.toBeInTheDocument();
	});

	it('con la bandera encendida monta la pantalla con el aviso de datos simulados', () => {
		flag.enabled = true;
		render(
			<ProcurementMockGate title='Proveedores' icon='HeroBuildingStorefront'>
				<Pantalla />
			</ProcurementMockGate>,
		);

		expect(screen.getByText('Listado de proveedores')).toBeInTheDocument();
		expect(screen.getByText('Datos simulados')).toBeInTheDocument();
		expect(screen.queryByText('Pantalla no habilitada')).not.toBeInTheDocument();
	});
});
