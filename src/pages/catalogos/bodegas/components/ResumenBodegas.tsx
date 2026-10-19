import React from 'react';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';
import type { IBodegasResumen } from '../types';

const kpisBodegas = (summary: IBodegasResumen): IInventarioKpi[] => [
	{
		label: 'Bodegas',
		value: summary.total,
		icon: 'HeroBuildingStorefront',
		accent: 'bg-blue-600',
	},
	{ label: 'Activas', value: summary.actives, icon: 'HeroCheckCircle', accent: 'bg-emerald-600' },
	{ label: 'Unidades', value: summary.units, icon: 'HeroArchiveBox', accent: 'bg-violet-600' },
	{
		label: 'Cerca de su capacidad',
		value: summary.nearCapacity,
		icon: 'HeroExclamationTriangle',
		accent: 'bg-amber-600',
	},
];

/** KPI de las bodegas de la sucursal, con el mismo formato que Inventario. */
const ResumenBodegas: React.FC<{ summary: IBodegasResumen; loading: boolean }> = ({
	summary,
	loading,
}) => {
	if (loading)
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
	return <InventarioKpis kpis={kpisBodegas(summary)} />;
};

export default ResumenBodegas;
