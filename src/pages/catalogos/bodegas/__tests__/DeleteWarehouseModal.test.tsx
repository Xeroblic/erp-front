import React, { type PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { IWarehouse } from '@/interface/warehouse.interface';
import DeleteWarehouseModal from '../modals/DeleteWarehouseModal';

vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: PropsWithChildren<{ isOpen: boolean }>) =>
		isOpen ? <section>{children}</section> : null,
	ModalHeader: ({ children }: PropsWithChildren) => <header>{children}</header>,
	ModalBody: ({ children }: PropsWithChildren) => <div>{children}</div>,
	ModalFooter: ({ children }: PropsWithChildren) => <footer>{children}</footer>,
	ModalFooterChild: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: PropsWithChildren<{ onClick?: () => void }>) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
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

const warehouse: IWarehouse = {
	id: 7,
	name: 'Bodega Norte',
	code: 'BN-7',
	branch_id: 1,
	warehouse_type: 'Secundaria',
	maximum_capacity: null,
	is_active: true,
	requires_serial_tracking: false,
};

const renderModal = (adjustStockLink: string | null) =>
	render(
		<MemoryRouter>
			<DeleteWarehouseModal
				isOpen
				setIsOpen={vi.fn()}
				warehouse={warehouse}
				onConfirm={vi.fn(() => Promise.resolve(false))}
				blockedByStock
				adjustStockLink={adjustStockLink}
			/>
		</MemoryRouter>,
	);

describe('DeleteWarehouseModal', () => {
	it('explica que hay que trasladar o ajustar el stock y enlaza al ajuste', () => {
		renderModal('/inventario/abastecimiento/ajustes-traslados?tab=ajuste&warehouse_id=7');

		expect(screen.getByText('La bodega todavía tiene stock')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Para eliminarla, primero traslada su stock a otra ubicación o ajústalo.',
			),
		).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Ir a Ajustes y traslados' })).toHaveAttribute(
			'href',
			'/inventario/abastecimiento/ajustes-traslados?tab=ajuste&warehouse_id=7',
		);
		expect(
			screen.queryByRole('button', { name: 'Sí, eliminar bodega' }),
		).not.toBeInTheDocument();
	});

	it('sin permiso para ajustar, explica el bloqueo sin enlace', () => {
		renderModal(null);

		expect(screen.getByText('La bodega todavía tiene stock')).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});
});
