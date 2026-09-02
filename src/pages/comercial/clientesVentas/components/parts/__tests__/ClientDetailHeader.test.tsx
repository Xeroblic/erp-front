import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ICustomerSale } from '@/interface/customerSales.interface';
import ClientDetailHeader from '../ClientDetailHeader';

vi.mock('gsap', () => ({
	gsap: {
		context: (callback: () => void) => {
			callback();
			return { revert: vi.fn() };
		},
		from: vi.fn(),
	},
}));
vi.mock('@/components/layouts/Subheader/Subheader', () => ({
	default: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
	SubheaderLeft: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	SubheaderRight: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Badge', () => ({
	default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children }: { children: React.ReactNode }) => (
		<button type='button'>{children}</button>
	),
}));

const customer = (type: unknown): ICustomerSale =>
	({
		id: 8,
		subsidiary_id: 1,
		name: 'Comercial Andina Ltda.',
		document_type: 'rut',
		document_number: '76.123.456-7',
		type,
		rut: '76.123.456-7',
		billing_company: 'Comercial Andina Ltda.',
		email: 'contacto@andina.cl',
		is_active: true,
		created_at: '2026-08-24T00:00:00Z',
		updated_at: '2026-08-24T00:00:00Z',
	}) as ICustomerSale;

const renderHeader = (type: unknown) =>
	render(
		<ClientDetailHeader
			client={customer(type)}
			contactName='Ana Pérez'
			onBack={vi.fn()}
			onEditToggle={vi.fn()}
			onCancelEdit={vi.fn()}
			onSave={vi.fn()}
			isEditable={false}
			isSubmitting={false}
		/>,
	);

describe('ClientDetailHeader', () => {
	it.each([
		['company', 'Empresa'],
		['natural', 'Persona Natural'],
		[undefined, 'Sin información'],
		['legacy', 'Sin información'],
	])('muestra %s como %s sin asumir persona natural', (type, label) => {
		renderHeader(type);
		expect(screen.getByText(label)).toBeInTheDocument();
	});
});
