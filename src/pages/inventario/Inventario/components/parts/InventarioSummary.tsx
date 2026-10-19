import React from 'react';
import type { IInventoryStockSummary } from '@/interface/inventoryOverview.interface';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';

/** Tarjeta sólo si la fuente publica la cifra: `null` no se muestra como `0`. */
const kpi = (value: number | null, rest: Omit<IInventarioKpi, 'value'>): IInventarioKpi[] =>
	value === null ? [] : [{ ...rest, value }];

const kpisInventario = (summary: IInventoryStockSummary): IInventarioKpi[] => [
	...kpi(summary.physical_quantity, {
		label: 'Stock total',
		icon: 'HeroArchiveBox',
		accent: 'bg-blue-600',
	}),
	...kpi(summary.products_count, {
		label: 'Productos con stock',
		icon: 'HeroCube',
		accent: 'bg-violet-600',
	}),
	...kpi(summary.unlocated_products_count, {
		label: 'Productos en Sin ubicación',
		icon: 'HeroInboxStack',
		accent: 'bg-zinc-700',
	}),
	...kpi(summary.critical_count, {
		label: 'Stock crítico',
		icon: 'HeroBellAlert',
		accent: 'bg-amber-600',
	}),
	...kpi(summary.out_count, { label: 'Sin stock', icon: 'HeroNoSymbol', accent: 'bg-red-600' }),
];

/** KPI de la sucursal (A2): tamaño del inventario y cuánto pide atención. */
const InventarioSummary: React.FC<{ summary: IInventoryStockSummary | null; loading: boolean }> = ({
	summary,
	loading,
}) => {
	if (loading || !summary)
		return (
			<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4' role='status'>
				<span className='sr-only'>Cargando resumen…</span>
				{Array.from({ length: 4 }, (_, index) => (
					<div
						key={index}
						className='h-[88px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800'
					/>
				))}
			</div>
		);
	return <InventarioKpis kpis={kpisInventario(summary)} />;
};

export default InventarioSummary;
