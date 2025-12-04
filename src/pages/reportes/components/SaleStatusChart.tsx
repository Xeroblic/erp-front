import React, { useMemo } from 'react';
import Chart from '@/components/Chart';

interface Props {
	data: any[];
}

const SalesStatusChart: React.FC<Props> = ({ data }) => {
	const { series, labels } = useMemo(() => {
		// Agrupar y contar por status
		const counts: Record<string, number> = {};
		data.forEach((r) => {
			const status = r.status || 'Desconocido';
			counts[status] = (counts[status] || 0) + 1;
		});

		return {
			labels: Object.keys(counts),
			series: Object.values(counts),
		};
	}, [data]);

	return (
		<div className='rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900'>
			<h3 className='mb-4 font-bold text-zinc-700 dark:text-zinc-200'>
				Distribución por Estado
			</h3>
			<Chart
				type='donut'
				height={300}
				series={series}
				options={{
					labels,
					colors: ['#10B981', '#F59E0B', '#EF4444', '#6366F1'], // Colores flaites pero bonitos
					legend: { position: 'bottom' },
					plotOptions: { pie: { donut: { size: '65%' } } },
				}}
			/>
		</div>
	);
};

export default SalesStatusChart;
