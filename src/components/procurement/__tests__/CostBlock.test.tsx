import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	grossEnteredCost,
	mixedBasisCost,
	netEnteredCost,
	unknownCost,
	weightedNetCost,
} from '@/mocks/db/procurement.db';
import CostBlock from '../CostBlock';

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

describe('CostBlock', () => {
	it('muestra el monto ingresado con su base y el desglose del servidor', () => {
		render(<CostBlock cost={grossEnteredCost} />);

		// El bruto aparece dos veces —como monto ingresado y en el desglose—
		// porque en esta operación se digitó justamente el bruto.
		expect(screen.getAllByText('$5.712,00')).toHaveLength(2);
		expect(screen.getByText(/\(bruto\)/)).toBeInTheDocument();
		expect(screen.getByText('IVA 19.00%')).toBeInTheDocument();
		expect(screen.getByText('$912,00')).toBeInTheDocument();
		// El costo efectivo es el neto: factura bajo premisa de IVA recuperable,
		// de ahí que $4.800,00 aparezca como neto y como efectivo.
		expect(screen.getAllByText('$4.800,00')).toHaveLength(2);
		expect(screen.getByText('Base efectiva: Neto')).toBeInTheDocument();
	});

	it('distingue la base efectiva de la base ingresada', () => {
		// Entrada neta sobre boleta: se ingresó neto, pero se compara en bruto.
		render(<CostBlock cost={netEnteredCost} />);

		expect(screen.getByText('Base efectiva: Bruto')).toBeInTheDocument();
		expect(screen.getByText(/\(neto\)/)).toBeInTheDocument();
	});

	it('presenta un costo desconocido como desconocido y nunca como $0', () => {
		const { container } = render(<CostBlock cost={unknownCost} />);

		expect(screen.getByText('Costo de compra desconocido')).toBeInTheDocument();
		expect(screen.getByText('Origen desconocido')).toBeInTheDocument();
		// La afirmación que importa: en ningún lugar del bloque aparece un cero
		// monetario que sugiera que la unidad no costó nada.
		expect(container.textContent).not.toMatch(/\$0([.,]|\b)/);
	});

	it('distingue el agregado de base mixta del de base única', () => {
		const { rerender, container } = render(<CostBlock cost={weightedNetCost} />);

		expect(screen.getByText('Base efectiva: Neto')).toBeInTheDocument();
		expect(container.textContent).not.toMatch(/bases distintas/);

		rerender(<CostBlock cost={mixedBasisCost} />);

		expect(screen.getByText('Base efectiva: Bases mixtas')).toBeInTheDocument();
		expect(screen.getByText(/no es comparable contra un neto/)).toBeInTheDocument();
	});

	it('etiqueta el origen y el cálculo con el vocabulario del contrato', () => {
		render(<CostBlock cost={mixedBasisCost} />);

		expect(screen.getByText('Respaldado por documento')).toBeInTheDocument();
		expect(screen.getByText('Ponderado dentro de la recepción')).toBeInTheDocument();
	});
});
