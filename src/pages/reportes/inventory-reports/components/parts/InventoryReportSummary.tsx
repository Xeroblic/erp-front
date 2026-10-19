import React from 'react';
import InventarioKpis, {
	type IInventarioKpi,
} from '@/pages/inventario/Inventario/components/parts/InventarioKpis';

interface IInventoryReportSummaryProps {
	kpis: IInventarioKpi[] | null;
	loading: boolean;
	/** La pestaña tiene KPI: mientras carga se reserva su lugar. */
	expected: boolean;
}

/** KPI del reporte con las mismas tarjetas que el resumen de Inventario. */
const InventoryReportSummary: React.FC<IInventoryReportSummaryProps> = ({
	kpis,
	loading,
	expected,
}) => {
	if (kpis && !loading) return <InventarioKpis kpis={kpis} />;
	if (!expected || !loading) return null;
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
};

export default InventoryReportSummary;
