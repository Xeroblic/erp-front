import React from 'react';
import type { IInventoryStockSummary } from '@/interface/inventoryOverview.interface';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';

const kpisInventario = (summary: IInventoryStockSummary): IInventarioKpi[] => [
	{
		label: 'Stock total',
		value: summary.physical_quantity,
		icon: 'HeroArchiveBox',
		accent: 'bg-blue-600',
	},
	{
		label: 'Productos',
		value: summary.products_count,
		icon: 'HeroCube',
		accent: 'bg-violet-600',
	},
	{
		label: 'Stock crítico',
		value: summary.critical_count,
		icon: 'HeroBellAlert',
		accent: 'bg-amber-600',
	},
	{ label: 'Sin stock', value: summary.out_count, icon: 'HeroNoSymbol', accent: 'bg-red-600' },
];

/** KPI de la sucursal (A2): tamaño del inventario y cuánto pide atención. */
const ResumenInventario: React.FC<{ summary: IInventoryStockSummary | null; loading: boolean }> = ({
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

export default ResumenInventario;
