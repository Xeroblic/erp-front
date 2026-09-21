import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IInventoryCriticalStock } from '@/interface/inventoryOverview.interface';
import EstadoStockPill from '@/pages/inventario/Inventario/components/parts/EstadoStockPill';

const critical = (patch: Partial<IInventoryCriticalStock>): IInventoryCriticalStock => ({
	scope: 'branch',
	physical_quantity: 4,
	fit_quantity: 4,
	unfit_quantity: 0,
	held_quantity: 0,
	available_quantity: 4,
	threshold: 2,
	status: 'healthy',
	...patch,
});

describe('EstadoStockPill', () => {
	it('con stock vendible pero todo reservado dice «Todo reservado»', () => {
		render(
			<EstadoStockPill
				critical={critical({ held_quantity: 4, available_quantity: 0, status: 'critical' })}
			/>,
		);
		expect(screen.getByText('Todo reservado')).toBeInTheDocument();
	});

	it('sin unidades vendibles sigue diciendo «Sin disponible»', () => {
		render(
			<EstadoStockPill
				critical={critical({
					fit_quantity: 0,
					unfit_quantity: 4,
					available_quantity: 0,
					status: 'critical',
				})}
			/>,
		);
		expect(screen.getByText('Sin disponible')).toBeInTheDocument();
	});
});
