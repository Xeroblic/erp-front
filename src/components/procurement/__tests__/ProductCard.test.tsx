import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cableProduct, mouseProduct, notebookProduct } from '@/mocks/db/procurement.db';
import ProductCard from '../ProductCard';

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

describe('ProductCard', () => {
	it('pinta la ficha embebida sin pedir datos adicionales', () => {
		render(<ProductCard product={mouseProduct} />);

		expect(screen.getByRole('heading', { name: 'Mouse USB' })).toBeInTheDocument();
		expect(screen.getByText(/MOUSE-001/)).toBeInTheDocument();
		expect(screen.getByText(/Logitech/)).toBeInTheDocument();
		expect(screen.getByText('Mouse')).toBeInTheDocument();
		expect(screen.getByText('$7.990,00')).toBeInTheDocument();
	});

	it('distingue el producto serializado del que no lo es', () => {
		const { rerender } = render(<ProductCard product={notebookProduct} />);

		expect(screen.getByText('Serializado')).toBeInTheDocument();
		expect(screen.getByText('Grado A')).toBeInTheDocument();

		rerender(<ProductCard product={mouseProduct} />);

		expect(screen.queryByText('Serializado')).not.toBeInTheDocument();
	});

	it('muestra la oferta vigente y tacha el precio de lista', () => {
		render(<ProductCard product={notebookProduct} />);

		expect(screen.getByText('$849.990,00')).toBeInTheDocument();
		expect(screen.getByText('$899.990,00')).toHaveClass('line-through');
	});

	it('usa el nombre del producto cuando la imagen no trae alt', () => {
		render(<ProductCard product={notebookProduct} />);

		expect(screen.getByRole('img')).toHaveAccessibleName('Notebook X1 de 14 pulgadas');
	});

	it('presenta un costo de catálogo ausente como desconocido, no como $0', () => {
		const { container } = render(<ProductCard product={cableProduct} />);

		expect(screen.getByText('Desconocido')).toBeInTheDocument();
		expect(screen.getByText('Inactivo')).toBeInTheDocument();
		expect(container.textContent).not.toMatch(/\$0([.,]|\b)/);
	});

	it('omite descripción, categorías y precios en densidad compacta', () => {
		render(<ProductCard product={notebookProduct} density='compact' />);

		expect(screen.queryByText('Notebooks')).not.toBeInTheDocument();
		expect(screen.queryByText('Costo de catálogo')).not.toBeInTheDocument();
		// La identidad del producto sí se conserva: es lo mínimo de una celda.
		expect(screen.getByRole('heading', { name: 'Notebook X1 14"' })).toBeInTheDocument();
	});
});
