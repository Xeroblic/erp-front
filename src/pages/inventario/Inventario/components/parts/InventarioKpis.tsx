import React from 'react';
import Icon from '@/components/icon/Icon';
import Card, { CardBody } from '@/components/ui/Card';
import type { TIcons } from '@/types/icons.type';

export interface IInventarioKpi {
	label: string;
	value: number;
	icon: TIcons;
	/** Fondo de la caja del ícono, p. ej. `bg-blue-600`. */
	accent: string;
}

const GRID_COLUMNS: Record<number, string> = {
	3: 'xl:grid-cols-3',
	4: 'xl:grid-cols-4',
	5: 'xl:grid-cols-5',
};

/**
 * KPI de las fichas de Inventario (bodega y producto): caja de color con el
 * ícono en blanco, etiqueta y cifra, igual que `DeferredPaymentsKpis`.
 */
const InventarioKpis: React.FC<{ kpis: IInventarioKpi[] }> = ({ kpis }) => (
	<div className={`grid gap-4 sm:grid-cols-2 ${GRID_COLUMNS[kpis.length] ?? 'xl:grid-cols-4'}`}>
		{kpis.map((kpi) => (
			<Card
				key={kpi.label}
				className='h-full border border-zinc-200/80 bg-white/95 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900'>
				<CardBody className='flex items-center gap-4'>
					<div
						className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ${kpi.accent}`}>
						<Icon icon={kpi.icon} size='text-3xl' color='white' />
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-zinc-500 dark:text-zinc-300'>
							{kpi.label}
						</p>
						<p className='truncate text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white'>
							{kpi.value.toLocaleString('es-CL')}
						</p>
					</div>
				</CardBody>
			</Card>
		))}
	</div>
);

export default InventarioKpis;
